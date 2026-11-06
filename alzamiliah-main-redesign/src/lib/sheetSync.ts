import prisma from '@/lib/prisma';
import { fetchSheetRows } from '@/lib/googleSheets';

export class SheetValidationError extends Error {
  issues: {
    type: 'missing_field' | 'duplicate' | 'unknown_status';
    unitCode: string;
    detail: string;
  }[];

  constructor(issues: SheetValidationError['issues']) {
    super(`يوجد ${issues.length} ${issues.length === 1 ? 'مشكلة' : 'مشكلات'} في بيانات الشيت يجب إصلاحها قبل المزامنة`);
    this.name = 'SheetValidationError';
    this.issues = issues;
  }
}

/* ============================================================
   خريطة الأعمدة: كل حقل ممكن يكون ليه أكتر من اسم مستخدم في
   شيتات العميل المختلفة (كل تاب/مشروع ممكن يسمي العمود شوية مختلف)
   ============================================================ */
const HEADER_ALIASES: Record<string, string[]> = {
  type: ['نوع الوحدة'],
  unitCode: ['كود الوحدة', 'الكود', 'كود'],
  buildingName: ['الزون'],
  floor: ['الدور'],
  area: ['المساحة الإجمالية (م²)', 'المساحة (م²)', 'المساحة'],
  // ملاحظة: نفس العمودين دول معناهم بيختلف حسب نوع الوحدة (type):
  // - شقة/دوبلكس: buildingArea = مساحة البناء، roofArea = مساحة السطح
  // - محل: buildingArea = مساحة الأرض، roofArea = مساحة الميزانين
  // القيم بتتخزن زي ما هي في نفس الحقلين، والفرونت اند هو اللي بيغيّر
  // الـ label المعروض حسب apt.type === "محل" (مش هنا في المزامنة)
  buildingArea: ['مساحة البناء (م²)', 'مساحة الأرضي (م²)', 'مساحة الأرض (م²)'],
  roofArea: ['مساحة السطح (م²)', 'مساحة الميزانين (م²)'],
  price: ['السعر (ر.س)', 'السعر'],
  bedrooms: ['غرف النوم', 'عدد الغرف'],
  bathrooms: ['الحمامات', 'دورات المياه'],
  balcony: ['الشرفة', 'البلكونات'],
  parking: ['موقف سيارات'],
  maidRoom: ['غرفة خادمة'],
  maidBathroom: ['حمام خادمة'],
  storage: ['مخزن'],
  laundry: ['غسيل'],
  direction: ['الاتجاه'],
  view: ['الإطلالة'],
  status: ['الحالة'],
  image: ['المخطط'],
};

// بنبني منها خريطة عكسية: اسم العمود (زي ما هو بالظبط) -> اسم الحقل في الداتابيز
const HEADER_MAP: Record<string, string> = Object.entries(
  HEADER_ALIASES,
).reduce(
  (acc, [field, aliases]) => {
    for (const alias of aliases) acc[alias] = field;
    return acc;
  },
  {} as Record<string, string>,
);

// الحقول الرقمية اللي لازم تتحول لأرقام (والباقي يفضل نص)
const NUMERIC_FIELDS = new Set([
  'area',
  'buildingArea',
  'roofArea',
  'price',
  'bedrooms',
  'bathrooms',
  'balcony',
  'parking',
  'maidRoom',
  'maidBathroom',
  'storage',
  'laundry',
]);

const STATUS_MAP: Record<string, string> = {
  متاح: 'available',
  available: 'available',
  محجوز: 'reserved',
  reserved: 'reserved',
  مباع: 'sold',
  sold: 'sold',
  محجوب: 'محجوب', // نفس القيمة الموجودة بالفعل في الابليكيشن (وحدة مخفية عن الموقع العام)
};

const VALID_STATUSES = ['available', 'reserved', 'sold', 'محجوب'];

// حقول مطلوبة (NOT NULL) في قاعدة البيانات - لازم يكون ليها fallback،
// أبدًا منسيبهاش تتبعت null في تحديث، عشان مايحصلش خطأ يوقف المزامنة نص الطريق
const REQUIRED_FIELD_FALLBACKS: Record<string, string> = {
  type: 'شقة',
  status: 'available',
};

interface ParsedRow {
  unitCode: string;
  fields: Record<string, string | number | null>;
}

function normalizeCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/**
 * لو القيمة لينك Google Drive عادي (share link)، بيحوّله لشكل
 * قابل للعرض المباشر كصورة. غير كده بيرجع اللينك زي ما هو.
 * لازم الملف يبقى مشارَك "Anyone with the link" عشان يشتغل فعليًا
 * لأن زوار الموقع بيحمّلوه من متصفحهم هما مباشرة.
 */
function normalizeImageLink(raw: string): string {
  if (!raw) return raw;

  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  let match = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;

  // https://drive.google.com/open?id=FILE_ID
  match = raw.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;

  return raw;
}

/**
 * يحول الصفوف الخام (array of arrays) لكائنات apartment جاهزة،
 * باستخدام صف العناوين عشان يلاقي كل عمود بمعزل عن ترتيبه.
 */
export function parseSheetRows(rawRows: unknown[][]): ParsedRow[] {
  if (!rawRows.length) return [];

  // أول صف فيه محتوى بيعتبر صف العناوين
  const headerRowIndex = rawRows.findIndex((r) =>
    r.some((cell) => normalizeCell(cell)),
  );
  if (headerRowIndex === -1) return [];

  const headerRow = rawRows[headerRowIndex].map(normalizeCell);
  const colIndexToField: Record<number, string> = {};
  headerRow.forEach((h, i) => {
    if (HEADER_MAP[h]) colIndexToField[i] = HEADER_MAP[h];
  });

  // "كود الوحدة" هو مفتاح المطابقة، لازم يبقى موجود بأي اسم من أسماءه المعروفة
  const hasUnitCodeColumn = Object.values(colIndexToField).includes('unitCode');
  if (!hasUnitCodeColumn) {
    throw new Error(
      `عمود "كود الوحدة" غير موجود في صف العناوين. الأعمدة الموجودة: ${headerRow.filter((h) => h).join(' | ')}`,
    );
  }

  const results: ParsedRow[] = [];

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !row.some((c) => normalizeCell(c))) continue; // صف فاضي بالكامل

    // الشيت أحيانًا بيتقسم لأقسام (شقق / ملاحق دوبلكس / محلات تجارية)،
    // وكل قسم بيتقدمه صف عنوان (بيتجاهل تلقائيًا لعدم وجود كود وحدة)
    // وصف بيكرر عناوين الأعمدة تاني (ممكن بأسماء مختلفة شوية زي "مساحة
    // الأرضي" بدل "مساحة البناء"). لازم نكتشف الصف ده ونتجاهله بالكامل،
    // وإلا هيتقرا كأنه صف بيانات فيه "كود الوحدة" و"الحالة" كنصوص حرفية.
    let headerLikeMatches = 0;
    let populatedMappedCols = 0;
    for (const [idxStr, field] of Object.entries(colIndexToField)) {
      const idx = Number(idxStr);
      const cell = normalizeCell(row[idx]);
      if (!cell) continue;
      populatedMappedCols++;
      if (HEADER_ALIASES[field]?.includes(cell)) headerLikeMatches++;
    }
    if (
      populatedMappedCols > 0 &&
      headerLikeMatches >= 2 &&
      headerLikeMatches / populatedMappedCols >= 0.5
    ) {
      continue; // صف تكرار هيدر - تجاهله بالكامل، مش صف بيانات
    }

    const fields: Record<string, string | number | null> = {};
    let unitCode = '';

    for (const [idxStr, field] of Object.entries(colIndexToField)) {
      const idx = Number(idxStr);
      const raw = normalizeCell(row[idx]);

      if (field === 'unitCode') {
        unitCode = raw;
        continue;
      }
      if (field === 'status') {
        fields.status = raw ? STATUS_MAP[raw] || raw : 'available';
        continue;
      }
      if (field === 'buildingName') {
        // "—" أو فاضي = من غير مبنى محدد
        fields.buildingName = raw && raw !== '—' ? raw : null;
        continue;
      }
      if (field === 'image') {
        fields.image = raw ? normalizeImageLink(raw) : null;
        continue;
      }
      if (NUMERIC_FIELDS.has(field)) {
        fields[field] = raw === '' ? null : Number(raw);
        continue;
      }
      fields[field] = raw || null;
    }

    if (!unitCode) continue; // مفيش كود وحدة = تجاهل الصف
    results.push({ unitCode, fields });
  }

  return results;
}

export interface SyncSummary {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
  /** اسم التبويب اللي فعلاً اتقرا منه - للتأكد إنه الصح */
  tabTitle: string;
  /** صفوف اتجاهلت خالص لأنها ناقصة بيانات إجبارية (سعر أو نوع) */
  invalid: { unitCode: string; reason: string }[];
  /** أكواد وحدات متكررة في نفس الشيت — بناخد أول ظهور بس ونتجاهل الباقي */
  duplicates: { unitCode: string; count: number }[];
  /** حالات مش من القيم المعروفة، اتصححت تلقائيًا لـ "available" */
  statusWarnings: { unitCode: string; rawStatus: string }[];
}

export async function syncProjectFromSheet(
  projectId: number,
): Promise<SyncSummary> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error('المشروع غير موجود');
  if (!project.sheetUrl) throw new Error('لا يوجد رابط شيت مرتبط بهذا المشروع');

  await prisma.project.update({
    where: { id: projectId },
    data: { sheetSyncStatus: 'syncing', sheetSyncError: null },
  });

  const summary: SyncSummary = {
    created: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    tabTitle: '',
    invalid: [],
    duplicates: [],
    statusWarnings: [],
  };

  try {
    const { rows: rawRows, tabTitle } = await fetchSheetRows(
      project.sheetUrl,
      project.sheetTabName,
    );
    summary.tabTitle = tabTitle;

    const allParsedRows = parseSheetRows(rawRows);
    const existingApts = await prisma.apartment.findMany({
      where: { projectId },
    });

    // حماية حرجة: لو الشيت رجع فاضي (0 وحدات) بس عندنا وحدات محفوظة قبل كده
    // من نفس المصدر، ده مؤشر على مشكلة في القراءة (رابط غلط/تاب غلط) مش إن
    // العميل مسح كل حاجة فعلاً. نوقف المزامنة كلها هنا وميتمسحش ولا حاجة.
    const sheetSourcedCount = existingApts.filter(
      (a) => a.source === 'sheet',
    ).length;
    if (allParsedRows.length === 0 && sheetSourcedCount > 0) {
      throw new Error(
        `التبويب "${tabTitle}" أعاد صفوفًا فارغة (0 صفوف) رغم وجود ${sheetSourcedCount} وحدة محفوظة من مزامنة سابقة. لم يتم حذفها لأن هذا غالبًا خطأ في الرابط أو اسم التبويب، وليس عملية حذف مقصودة. يُرجى التأكد من رابط الشيت واسم التبويب.`,
      );
    }

    const issues: SheetValidationError['issues'] = [];

    // 1) أكواد وحدات مكررة داخل نفس الشيت
    const seenCodes = new Map<string, number>();
    for (const row of allParsedRows) {
      seenCodes.set(row.unitCode, (seenCodes.get(row.unitCode) || 0) + 1);
    }
    for (const [unitCode, count] of seenCodes.entries()) {
      if (count > 1) {
        issues.push({
          type: 'duplicate',
          unitCode,
          detail:`هذا الكود مكرر ${count} ${count === 2 ? 'مرتين' : 'مرات'} داخل نفس الشيت`,
        });
      }
    }

    // 2) حقول إجبارية ناقصة (نفس قواعد فورم الأدمن)
    for (const row of allParsedRows) {
      const missing: string[] = [];
      if (row.fields.price === null || row.fields.price === undefined) {
        missing.push('السعر');
      }
      if (!row.fields.type) missing.push('نوع الوحدة');

      if (missing.length > 0) {
        issues.push({
          type: 'missing_field',
          unitCode: row.unitCode,
          detail: `بيانات ناقصة: ${missing.join(' و ')}`,
        });
      }
    }

    // 3) حالة (status) غير معروفة
    for (const row of allParsedRows) {
      const status = row.fields.status as string | null;
      if (status && !VALID_STATUSES.includes(status)) {
        issues.push({
          type: 'unknown_status',
          unitCode: row.unitCode,
          detail: `الحالة "${status}" ليست من القيم المعروفة (متاح/محجوز/مباع/محجوب)`,
        });
      }
    }

    // لو فيه أي مشكلة واحدة، نوقف هنا فورًا - قبل ما نبني dbByCode
    // أو نفتح transaction أصلًا. مفيش أي تغيير هيحصل في الداتابيز.
    if (issues.length > 0) {
      throw new SheetValidationError(issues);
    }

    const validRows = allParsedRows;

    const dbByCode = new Map(
      existingApts.map((a): [string, (typeof existingApts)[number]] => [
        a.unitCode || '',
        a,
      ]),
    );
    const sheetCodes = new Set(validRows.map((r) => r.unitCode));

    // كل العمليات جوه transaction واحدة - لو أي خطوة فشلت، كل حاجة بترجع
    // زي ما كانت (rollback)، مفيش حالة "نص البيانات اتغيرت والنص لأ"
    await prisma.$transaction(async (tx) => {
      // مهم: بنلف على validRows بس (مش parsedRows) - عشان الصفوف الناقصة
      // (زي اللي من غير سعر أو نوع) فعلاً متتسجلش في الداتابيز، مش بس تتسجل
      // في التقرير وتتزامن برضو
      for (const row of validRows) {
        const existing = dbByCode.get(row.unitCode);

        if (!existing) {
          await tx.apartment.create({
            data: {
              projectId,
              unitCode: row.unitCode,
              source: 'sheet',
              type: (row.fields.type as string) || 'شقة',
              buildingName: row.fields.buildingName as string | null,
              floor: row.fields.floor as string | null,
              area: row.fields.area as number | null,
              buildingArea: row.fields.buildingArea as number | null,
              roofArea: row.fields.roofArea as number | null,
              price: row.fields.price as number | null,
              bedrooms: row.fields.bedrooms as number | null,
              bathrooms: row.fields.bathrooms as number | null,
              balcony: row.fields.balcony as number | null,
              parking: row.fields.parking as number | null,
              maidRoom: row.fields.maidRoom as number | null,
              maidBathroom: row.fields.maidBathroom as number | null,
              storage: row.fields.storage as number | null,
              laundry: row.fields.laundry as number | null,
              direction: row.fields.direction as string | null,
              view: row.fields.view as string | null,
              status: (row.fields.status as string) || 'available',
              image: row.fields.image as string | null,
            },
          });
          summary.created++;
          continue;
        }

        // نقارن بس الحقول اللي جاية من الشيت - أي حقل مش موجود في الشيت (زي livingRoom..) منلمسوش
        const changed: Record<string, string | number | null> = {};
        for (const [field, value] of Object.entries(row.fields)) {
          const currentVal = (existing as Record<string, unknown>)[field];
          const normalizedCurrent =
            currentVal === undefined ? null : currentVal;

          // حماية: حقول مطلوبة (NOT NULL) زي type/status ماينفعش نبعتلها
          // null أبدًا، حتى لو الشيت جالنا فيها فاضي - نستخدم fallback بدلًا من كده
          let safeValue = value;
          if (safeValue === null && REQUIRED_FIELD_FALLBACKS[field]) {
            safeValue = REQUIRED_FIELD_FALLBACKS[field];
          }

          if (String(normalizedCurrent ?? '') !== String(safeValue ?? '')) {
            changed[field] = safeValue;
          }
        }

        if (Object.keys(changed).length > 0) {
          await tx.apartment.update({
            where: { id: existing.id },
            data: { ...changed, source: 'sheet' },
          });
          summary.updated++;
        } else {
          summary.skipped++;
        }
      }

      // الشيت هو مصدر الحقيقة الوحيد للمشروع المربوط بيه: أي وحدة (مهما
      // كان مصدرها الأصلي، يدوي أو من الشيت) مش موجودة في الشيت دلوقتي = تتمسح.
      // استثناء: وحدة من غير unitCode أصلًا مش بنلمسها، لأننا مش هنقدر
      // نتأكد إنها فعلًا مش موجودة في الشيت (مفيش حاجة نقارنها بيها).
      for (const apt of existingApts) {
        if (apt.unitCode && !sheetCodes.has(apt.unitCode)) {
          await tx.apartment.delete({ where: { id: apt.id } });
          summary.deleted++;
        }
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        sheetSyncStatus: 'success',
        sheetSyncError: null,
        sheetLastSyncedAt: new Date(),
        sheetLastSummary: `تبويب: ${tabTitle} | created: ${summary.created}, updated: ${summary.updated}, deleted: ${summary.deleted}, skipped: ${summary.skipped}`,
      },
    });

    return summary;
  } catch (err: unknown) {
    let message: string;

    if (err instanceof SheetValidationError) {
      // نحفظ التفاصيل كاملة كـ JSON، مش بس الرسالة العامة، عشان
      // الواجهة تقدر تعرض قايمة منظمة (كل مشكلة لوحدها) للأدمن
      message = JSON.stringify({
        summary: err.message,
        issues: err.issues,
      });
    } else {
      message = err instanceof Error ? err.message : 'خطأ غير معروف';
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { sheetSyncStatus: 'error', sheetSyncError: message },
    });
    throw err;
  }
}