import { google } from "googleapis";

/**
 * يقرا بيانات الشيت بس (Read-only) — الحساب ده مالوش صلاحية تعديل خالص.
 * الإيميل والمفتاح جايين من الـ Service Account اللي عملناه في Google Cloud.
 */
function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY غير موجودين في ملف .env",
    );
  }

  // في .env القيمة بتتخزن بـ \n حرفية، لازم نرجعها لسطر جديد حقيقي
  const privateKey = rawKey.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * يستخرج الـ Spreadsheet ID من أي شكل لينك جوجل شيت يبعته الأدمن.
 * مثال: https://docs.google.com/spreadsheets/d/1AbCxyz.../edit#gid=123456
 */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * يستخرج رقم الـ gid (رقم التبويب) من اللينك نفسه لو موجود.
 * مثال: .../edit?gid=121887871#gid=121887871 -> "121887871"
 * لو التاب الأول في الشيت (gid=0)، برضو بيتلقط صح لإن الـ regex بياخد أي رقم.
 */
export function extractGid(url: string): string | null {
  const match = url.match(/[?&#]gid=(\d+)/);
  return match ? match[1] : null;
}

export interface SheetFetchResult {
  rows: unknown[][];
  /** اسم التبويب اللي فعلاً اتقرا منه - عشان تتأكد إنه الصح */
  tabTitle: string;
  tabGid: string;
}

/**
 * يجيب كل الصفوف من التبويب (tab) المطلوب، ويرجّع كمان اسم ورقم
 * التبويب اللي فعلاً اتقرا منه - عشان تقدر تتأكد بعينك إنه صح.
 *
 * أولوية اختيار التبويب:
 *   1) tabName لو الأدمن كتبه يدوي في الحقل (فرض صريح، بيتجاهل الـ gid تمامًا)
 *   2) gid المستخرج من اللينك نفسه (ده الوضع الطبيعي والمتوقع)
 *   3) لو مفيش gid ولا tabName، ياخد أول تبويب (fallback أخير بس)
 *
 * لو gid موجود في اللينك ومفيش تبويب مطابق ليه، بيرمي error واضح
 * فورًا - مفيش fallback صامت لتبويب غلط أبدًا.
 */
export async function fetchSheetRows(
  sheetUrl: string,
  tabName?: string | null,
): Promise<SheetFetchResult> {
  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    throw new Error("رابط الشيت غير صحيح، لم يتم العثور على معرّف الجدول (Spreadsheet ID) ");
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const allSheets = meta.data.sheets || [];
  if (!allSheets.length) {
    throw new Error("لا يوجد أي تبويب في هذا الشيت إطلاقًا");
  }

  let targetSheet;

  if (tabName) {
    // الأدمن فارض اسم تبويب معين يدوي - ده له الأولوية المطلقة
    targetSheet = allSheets.find((s) => s.properties?.title === tabName);
    if (!targetSheet) {
      const available = allSheets.map((s) => s.properties?.title).join(" | ");
      throw new Error(
        `لا يوجد تبويب باسم "${tabName}". التبويبات الموجودة: ${available}`,
      );
    }
  } else {
    const gid = extractGid(sheetUrl);
    if (gid !== null) {
      targetSheet = allSheets.find(
        (s) => String(s.properties?.sheetId) === gid,
      );
      if (!targetSheet) {
        const available = allSheets
          .map(
            (s) => `${s.properties?.title} (gid=${s.properties?.sheetId})`,
          )
          .join(" | ");
        throw new Error(
         `لا يوجد تبويب برقم gid=${gid} في هذا الجدول. التبويبات الموجودة: ${available}`
        );
      }
    } else {
      // مفيش gid ولا tabName - ناخد أول تبويب كحل أخير
      targetSheet = allSheets[0];
    }
  }

  const title = targetSheet?.properties?.title;
  const resolvedGid = String(targetSheet?.properties?.sheetId ?? "");
  if (!title) {
    throw new Error("تعذر تحديد اسم التبويب المطلوب");
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: title,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  return {
    rows: (res.data.values as unknown[][]) || [],
    tabTitle: title,
    tabGid: resolvedGid,
  };
}
