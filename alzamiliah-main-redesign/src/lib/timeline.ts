import crypto from 'crypto';
import { Prisma, ProjectDataSource } from '@prisma/client';
import prisma from './prisma';

/* ============================================================
   Monthly records + phases (admin side)
   Rules enforced HERE (not only in the UI):
   - a manual record needs >= 3 percentage columns (media sections and text columns are optional)
   - a phase needs a cover image (image link or our own uploaded image)
   - a record used by a phase can never be deleted
   - a coloridea record can be deleted only if the project is not linked to ColorIdea
   - manual records are the only ones that can be edited
   ============================================================ */

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const MIN_PERCENT_COLUMNS = 3; // a manual record needs at least 3 percentages
const MAX_ROWS = 50;
const MAX_MEDIA = 20; // max items per media section
const COLUMN_TYPES = ['number', 'percent', 'text'] as const; // same types ColorIdea uses
type ColumnType = (typeof COLUMN_TYPES)[number];

export class TimelineError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'TimelineError';
    this.status = status;
  }
}

export interface ManualColumnInput {
  name: string;
  type: ColumnType;
  value: number | string;
}
export interface ManualMediaInput {
  name: string | null;
  link: string;
  photo: string | null; // optional thumbnail
}
export interface ManualMonthlyInput {
  month: string;
  columns: ManualColumnInput[];
  monthlyVideo: ManualMediaInput | null;
  ground: ManualMediaInput[];
  aerial: ManualMediaInput[];
  photo: ManualMediaInput[];
  timelapse: ManualMediaInput[];
  originNote: string | null;
}

/* ---------- validation ---------- */
function cleanText(v: unknown, max: number, label: string): string {
  if (typeof v !== 'string' || v.trim() === '')
    throw new TimelineError(`${label} مطلوب`);
  const s = v.trim();
  if (s.length > max) throw new TimelineError(`${label} أطول من ${max} حرف`);
  return s;
}

// http(s) link, or a file we uploaded ourselves (/uploads/...). Blocks javascript:, data:, //host and other paths
function cleanUrl(v: unknown, label: string): string {
  const s = cleanText(v, 2000, label);
  if (!/^(https?:\/\/|\/uploads\/)/i.test(s) || s.includes('..'))
    throw new TimelineError(`${label} غير صالح`);
  return s;
}

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|avi)$/i;

// the path part of a link (query and hash are ignored)
function pathOf(s: string, label: string): string {
  if (!/^https?:\/\//i.test(s)) return s.split(/[?#]/)[0];
  try {
    return new URL(s).pathname;
  } catch {
    throw new TimelineError(`${label} غير صالح`);
  }
}

// cover image / thumbnail: must really be an image (our own upload, or a link ending with an image extension)
function cleanImageUrl(v: unknown, label: string): string {
  const s = cleanUrl(v, label);
  if (!IMAGE_EXT_RE.test(pathOf(s, label))) {
    throw new TimelineError(`${label} لازم يكون صورة: ارفعها من جهازك أو حط لينك مباشر ينتهي بـ jpg أو png أو webp أو gif`);
  }
  return s;
}

function optionalImageUrl(v: unknown, label: string): string | null {
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return null;
  return cleanImageUrl(v, label);
}

function optionalText(v: unknown, max: number, label: string): string | null {
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return null;
  return cleanText(v, max, label);
}

const VIDEO_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
]);

// an external link that really points to ONE image or video: a file ending with an image/video extension,
// YouTube / Vimeo, or a single file on Drive (a Drive FOLDER is not accepted: it cannot be shown on the site)
function isDirectMediaLink(s: string): boolean {
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (IMAGE_EXT_RE.test(url.pathname) || VIDEO_EXT_RE.test(url.pathname)) return true;
  if (VIDEO_HOSTS.has(host)) return true;
  return host === 'drive.google.com' && /^\/file\/d\/[^/]+/.test(url.pathname);
}

// media section link. An uploaded file must be an image/video (never a PDF).
// kind 'media' (ground / aerial / photography): an external link must be a direct image/video link (see above).
// kind 'video' (monthly video, timelapse): any external link is accepted (Tikee timelapse links, etc.)
type MediaKind = 'media' | 'video'; // media = image or video
function cleanMediaLink(v: unknown, kind: MediaKind, label: string): string {
  const s = cleanUrl(v, label);
  if (/^\/uploads\//i.test(s)) {
    const path = pathOf(s, label);
    const ok = kind === 'video' ? VIDEO_EXT_RE.test(path) : IMAGE_EXT_RE.test(path) || VIDEO_EXT_RE.test(path);
    if (!ok) {
      throw new TimelineError(
        kind === 'video'
          ? `${label} لازم يكون ملف فيديو (mp4 أو webm أو mov أو avi) أو لينك`
          : `${label} لازم يكون صورة أو فيديو أو لينك`,
      );
    }
  } else if (kind === 'media' && !isDirectMediaLink(s)) {
    throw new TimelineError(
      `${label} لازم يكون صورة أو فيديو: ارفعها من جهازك، أو حط لينك مباشر (صورة، فيديو، يوتيوب، فيميو، أو ملف واحد من Drive). لينك فولدر Drive مش مقبول`,
    );
  }
  return s;
}

function parseMediaItem(v: unknown, kind: MediaKind, label: string): ManualMediaInput {
  const item = (v ?? {}) as Record<string, unknown>;
  return {
    name: optionalText(item.name, 200, `اسم ${label}`),
    link: cleanMediaLink(item.link, kind, `رابط ${label}`),
    photo: optionalImageUrl(item.photo, `الصورة المصغّرة - ${label}`),
  };
}

function parseMediaList(raw: unknown, kind: MediaKind, max: number, label: string): ManualMediaInput[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new TimelineError(`${label} غير صالح`);
  if (raw.length > max) throw new TimelineError(`${label}: الحد الأقصى ${max}`);
  return raw.map((v, i) => parseMediaItem(v, kind, `${label} (${i + 1})`));
}

export function parseManualInput(raw: unknown): ManualMonthlyInput {
  if (!raw || typeof raw !== 'object')
    throw new TimelineError('بيانات غير صالحة');
  const r = raw as Record<string, unknown>;

  if (typeof r.month !== 'string' || !MONTH_REGEX.test(r.month)) {
    throw new TimelineError('الشهر غير صالح (مثال: 2025-09)');
  }

  if (!Array.isArray(r.columns)) throw new TimelineError('أرقام التقرير مطلوبة');
  if (r.columns.length > MAX_ROWS) throw new TimelineError('عدد الأرقام كبير جدًا');

  const columns: ManualColumnInput[] = r.columns.map((c, i) => {
    const col = (c ?? {}) as Record<string, unknown>;
    const label = `الرقم ${i + 1}`;
    const name = cleanText(col.name, 200, `اسم ${label}`);
    if (!COLUMN_TYPES.includes(col.type as ColumnType)) {
      throw new TimelineError(`نوع ${label} غير صالح`);
    }
    const type = col.type as ColumnType;

    if (type === 'text')
      return { name, type, value: cleanText(col.value, 2000, `قيمة ${label}`) };

    const rawValue = typeof col.value === 'string' ? col.value.trim() : col.value;
    const n =
      rawValue === '' || rawValue === null || rawValue === undefined
        ? NaN
        : Number(rawValue);
    if (!Number.isFinite(n)) throw new TimelineError(`قيمة ${label} لازم تكون رقم`);
    if (type === 'percent' && (n < 0 || n > 100))
      throw new TimelineError(`قيمة ${label} لازم تكون بين 0 و 100`);
    return { name, type, value: n };
  });

  if (columns.filter((c) => c.type === 'percent').length < MIN_PERCENT_COLUMNS) {
    throw new TimelineError(`لازم تدخل ${MIN_PERCENT_COLUMNS} نسب مئوية على الأقل`);
  }

  const monthlyVideo =
    r.monthlyVideo === undefined || r.monthlyVideo === null
      ? null
      : parseMediaItem(r.monthlyVideo, 'video', 'الفيديو الشهري');

  const originNote =
    typeof r.originNote === 'string' && r.originNote.trim() !== ''
      ? cleanText(r.originNote, 200, 'الملاحظة')
      : null;

  return {
    month: r.month,
    columns,
    monthlyVideo,
    ground: parseMediaList(r.ground, 'media', MAX_MEDIA, 'التصوير الأرضي'),
    aerial: parseMediaList(r.aerial, 'media', MAX_MEDIA, 'التصوير الجوي'),
    photo: parseMediaList(r.photo, 'media', MAX_MEDIA, 'التصوير الفوتوغرافي'),
    timelapse: parseMediaList(r.timelapse, 'video', MAX_MEDIA, 'التايم لابس'),
    originNote,
  };
}

// same shape as a ColorIdea record: report.columns + outputs.{photo,aerial,ground,monthly_video} (+ timelapse for manual records)
function withIds(items: ManualMediaInput[]) {
  return items.map((v) => ({
    id: crypto.randomUUID(),
    name: v.name,
    link: v.link,
    photo: v.photo,
    date: null,
  }));
}

function toRecordData(input: ManualMonthlyInput) {
  return {
    month: input.month,
    report: { columns: input.columns } as unknown as Prisma.InputJsonValue,
    outputs: {
      photo: withIds(input.photo),
      aerial: withIds(input.aerial),
      ground: withIds(input.ground),
      monthly_video: input.monthlyVideo ? withIds([input.monthlyVideo]) : [],
      timelapse: withIds(input.timelapse),
    } as unknown as Prisma.InputJsonValue,
  };
}

/* ---------- rules ---------- */

/* ---------- monthly records ---------- */
export async function listMonthly(projectId: number) {
  return prisma.projectMonthlyData.findMany({
    where: { projectId },
    orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      month: true,
      source: true,
      externalProjectId: true,
      originNote: true,
      report: true,
      outputs: true,
      updatedAt: true,
      phase: { select: { id: true, isLatest: true } },
    },
  });
}

export async function createManualMonthly(projectId: number, raw: unknown) {
  const input = parseManualInput(raw);
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) throw new TimelineError('المشروع غير موجود', 404);

  return prisma.projectMonthlyData.create({
    data: {
      projectId,
      source: ProjectDataSource.MANUAL,
      externalProjectId: null,
      originNote: input.originNote,
      ...toRecordData(input),
    },
    select: { id: true, month: true },
  });
}

export async function updateManualMonthly(
  projectId: number,
  recordId: number,
  raw: unknown,
  db: Pick<Prisma.TransactionClient, "projectMonthlyData"> = prisma,
) {
  const record = await db.projectMonthlyData.findFirst({
    where: { id: recordId, projectId },
    select: { id: true, month: true, source: true },
  });
  if (!record) throw new TimelineError('السجل غير موجود', 404);
  if (record.source !== ProjectDataSource.MANUAL) {
    throw new TimelineError('بيانات ColorIdea لا يمكن تعديلها', 403);
  }

  const input = parseManualInput(raw);

  return db.projectMonthlyData.update({
    where: { id: recordId },
    data: { originNote: input.originNote, ...toRecordData(input) },
    select: { id: true, month: true },
  });
}

export async function deleteMonthly(projectId: number, recordId: number) {
  const record = await prisma.projectMonthlyData.findFirst({
    where: { id: recordId, projectId },
    select: {
      id: true,
      month: true,
      source: true,
      phase: { select: { id: true } },
    },
  });
  if (!record) throw new TimelineError('السجل غير موجود', 404);

  if (record.phase) {
    throw new TimelineError(
      `السجل مستخدم في مرحلة شهر ${record.month}. لو عايز تمسحه، غيّر السجل المرتبط بالمرحلة دي الأول`,
      409,
    );
  }

  if (record.source === ProjectDataSource.COLORIDEA) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { externalProjectId: true },
    });
    if (project?.externalProjectId) {
      throw new TimelineError(
        'ده سجل متزامن من ColorIdea. لازم تفك ربط المشروع الأول لو عايز تمسحه',
        409,
      );
    }
  }

  try {
    await prisma.projectMonthlyData.delete({ where: { id: recordId } });
  } catch (err) {
    // the database itself refuses (a phase was linked a moment ago)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      throw new TimelineError('السجل مستخدم في مرحلة', 409);
    }
    throw err;
  }
}






/* ============================================================
   Phases
   - a phase ALWAYS has a monthly record (no drafts)
   - one record = one phase (also enforced by the database: unique monthlyDataId)
   - only one phase per project can have the "latest report" tag (also enforced by a partial index)
   ============================================================ */
type Tx = Prisma.TransactionClient;

const phaseSelect = {
  id: true,
  coverImage: true,
  isLatest: true,
  sortOrder: true,
  createdAt: true,
  monthlyData: {
    select: { id: true, month: true, source: true, originNote: true, report: true, outputs: true },
  },
} satisfies Prisma.ProjectPhaseSelect;

export async function listPhases(projectId: number) {
  return prisma.projectPhase.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: phaseSelect,
  });
}

function asBody(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') throw new TimelineError('بيانات غير صالحة');
  return raw as Record<string, unknown>;
}

function mapPhaseError(err: unknown): unknown {
  // the database refused a duplicate (same record in two phases, or two "latest" tags)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return new TimelineError('حصل تعارض (السجل مستخدم في مرحلة أخرى)، حاول تاني', 409);
  }
  return err;
}


// a record can be used by a phase only if its report has at least one number
function hasReportData(report: unknown): boolean {
  const cols = (report as { columns?: unknown } | null)?.columns;
  if (!Array.isArray(cols)) return false;
  return cols.some((c) => {
    const col = (c ?? {}) as { type?: unknown; value?: unknown };
    return (col.type === 'percent' || col.type === 'number') && typeof col.value === 'number' && Number.isFinite(col.value);
  });
}


/**
 * Finds the record id the phase should use:
 *  - monthlyDataId : an existing record of this project that no OTHER phase uses
 *  - manual        : creates a new manual record now (same transaction)
 *  - neither       : null
 */
async function resolveRecord(
  tx: Tx,
  projectId: number,
  body: Record<string, unknown>,
  currentPhaseId?: number,
): Promise<number | null> {
  const hasId = body.monthlyDataId !== undefined && body.monthlyDataId !== null;
  const hasManual = body.manual !== undefined && body.manual !== null;

  if (hasId && hasManual) {
    throw new TimelineError('اختار سجل موجود أو أدخل بيانات يدوية، مش الاتنين');
  }

  if (hasManual) {
    const input = parseManualInput(body.manual);
    const created = await tx.projectMonthlyData.create({
      data: {
        projectId,
        source: ProjectDataSource.MANUAL,
        externalProjectId: null,
        originNote: input.originNote,
        ...toRecordData(input),
      },
      select: { id: true },
    });
    return created.id;
  }

  if (hasId) {
    const recordId = Number(body.monthlyDataId);
    if (!Number.isInteger(recordId) || recordId <= 0) throw new TimelineError('السجل غير صالح');

    const record = await tx.projectMonthlyData.findFirst({
      where: { id: recordId, projectId },
      select: { id: true, report: true, phase: { select: { id: true } } },
    });
    if (!record) throw new TimelineError('السجل غير موجود في هذا المشروع', 404);
    if (record.phase && record.phase.id !== currentPhaseId) {
      throw new TimelineError('السجل ده مستخدم في مرحلة أخرى', 409);
    }
    if (!hasReportData(record.report)) {
      throw new TimelineError('السجل ده مفيهوش أي أرقام تقرير، فمينفعش تربطه بمرحلة');
    }
    return record.id;
  }

  return null;
}

export async function createPhase(projectId: number, raw: unknown) {
  const body = asBody(raw);
  const coverImage = cleanImageUrl(body.coverImage, 'صورة المرحلة');

  try {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId }, select: { id: true } });
      if (!project) throw new TimelineError('المشروع غير موجود', 404);

      const recordId = await resolveRecord(tx, projectId, body);
      if (recordId === null) throw new TimelineError('اختار سجل شهري أو أدخل بيانات يدوية');

      const last = await tx.projectPhase.aggregate({ where: { projectId }, _max: { sortOrder: true } });
      const wantsLatest = body.isLatest === true;
      if (wantsLatest) {
        await tx.projectPhase.updateMany({ where: { projectId, isLatest: true }, data: { isLatest: false } });
      }

      return tx.projectPhase.create({
        data: {
          projectId,
          monthlyDataId: recordId,
          coverImage,
          isLatest: wantsLatest,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
        },
        select: { id: true },
      });
    });
  } catch (err) {
    throw mapPhaseError(err);
  }
}

export async function updatePhase(projectId: number, phaseId: number, raw: unknown) {
  const body = asBody(raw);

  try {
    return await prisma.$transaction(async (tx) => {
      const phase = await tx.projectPhase.findFirst({
        where: { id: phaseId, projectId },
        select: { id: true, monthlyDataId: true },
      });
      if (!phase) throw new TimelineError('المرحلة غير موجودة', 404);

      const data: Prisma.ProjectPhaseUncheckedUpdateInput = {};

      const manualUpdate = body.manualUpdate === undefined ? null : asBody(body.manualUpdate);
      if (manualUpdate) {
        if (body.manual !== undefined || body.monthlyDataId !== undefined || manualUpdate.id !== phase.monthlyDataId) {
          throw new TimelineError('تغيّر السجل المرتبط بالمرحلة. حدّث الصفحة وحاول مرة أخرى.', 409);
        }
        await updateManualMonthly(projectId, phase.monthlyDataId, manualUpdate.data, tx);
      }

      // switching the record is ONE operation: the phase never stays without data
      const recordId = await resolveRecord(tx, projectId, body, phaseId);
      if (recordId !== null) data.monthlyDataId = recordId;

      if (body.coverImage !== undefined) {
        data.coverImage = cleanImageUrl(body.coverImage, 'صورة المرحلة');
      }

      if (typeof body.isLatest === 'boolean') {
        if (body.isLatest) {
          await tx.projectPhase.updateMany({
            where: { projectId, isLatest: true, NOT: { id: phaseId } },
            data: { isLatest: false },
          });
        }
        data.isLatest = body.isLatest;
      }

      if (body.sortOrder !== undefined) {
        const n = Number(body.sortOrder);
        if (!Number.isInteger(n) || n < 0 || n > 100000) throw new TimelineError('الترتيب غير صالح');
        data.sortOrder = n;
      }

      if (Object.keys(data).length === 0) throw new TimelineError('مفيش تعديل مطلوب');

      return tx.projectPhase.update({ where: { id: phaseId, ...(manualUpdate ? { monthlyDataId: phase.monthlyDataId } : {}) }, data, select: { id: true } });
    });
  } catch (err) {
    throw mapPhaseError(err);
  }
}

// deletes the phase only; its monthly record stays and becomes free
export async function deletePhase(projectId: number, phaseId: number) {
  const phase = await prisma.projectPhase.findFirst({
    where: { id: phaseId, projectId },
    select: { id: true },
  });
  if (!phase) throw new TimelineError('المرحلة غير موجودة', 404);
  await prisma.projectPhase.delete({ where: { id: phaseId } });
}