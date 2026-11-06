import { Prisma, ProjectDataSource } from '@prisma/client';
import prisma from './prisma';
import { createDriveContext, resolveDriveItems } from './driveImport';

/* ============================================================
   ColorIdea integration (server only)
   - Pulls the monthly data + timelapse of a project from the ColorIdea API.
   - Never touches the project's own fields (name, description, images ...).
   - Manual monthly records are NEVER touched by a sync.
   ============================================================ */


const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const REQUEST_TIMEOUT_MS = 15000;


export class ColorIdeaError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ColorIdeaError';
    this.status = status;
  }
}

/* ---------- types of the ColorIdea response ---------- */

export interface RemoteItem {
  id: string;
  name: string;
  link: string | null;
  photo: string | null;
  date: string | null;
  /** set by the Drive import: the Drive folder link this item came from */
  source?: string;
  /** set by the Drive import: what `link` points to */
  kind?: 'image' | 'video' | 'link';
}

export interface RemoteReportColumn {
  name: string;
  type: string;
  value: string | number | null;
}
export interface RemoteOutputs {
  photo: RemoteItem[];
  aerial: RemoteItem[];
  ground: RemoteItem[];
  monthly_video: RemoteItem[];
}
export interface RemoteMonth {
  month: string;
  report: { columns: RemoteReportColumn[] } | null;
  outputs: RemoteOutputs;
}
export interface RemoteMonthlyData {
  months: RemoteMonth[];
  timeLapse: RemoteItem[];
}
export interface RemoteProject {
  id: string;
  name: string;
}


/** the outputs sections that can hold Drive links (timelapse comes from Tikee, untouched) */
const DRIVE_SECTIONS = ['photo', 'aerial', 'ground', 'monthly_video'] as const;

export interface SyncOptions {
  /** max time spent downloading Drive images; the rest waits for the next sync */
  driveBudgetMs?: number;
}

export type SyncResult =
  | { status: 'not_linked' }
  | { status: 'not_found' } // the project no longer exists in ColorIdea: nothing was changed
    | { status: 'empty' } // ColorIdea returned no months and no timelapse: nothing was deleted
  | { status: 'synced'; months: number; timelapse: number; pendingImages: number };

export function isValidExternalId(id: unknown): id is string {
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id);
}


/* ---------- http ---------- */
function config() {
  // COLORIDEA_API_URL example: https://api.example.com/api/v1/integrations
  const baseUrl = process.env.COLORIDEA_API_URL?.replace(/\/+$/, '');
  const apiKey = process.env.COLORIDEA_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new ColorIdeaError('COLORIDEA_API_URL / COLORIDEA_API_KEY غير موجودين في ملف .env', 500);
  }
  return { baseUrl, apiKey };
}



async function request<T>(path: string): Promise<T> {
  const { baseUrl, apiKey } = config();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: { Authorization: apiKey, Accept: 'application/json' }, // no "Bearer"
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    throw new ColorIdeaError('تعذر الاتصال بـ ColorIdea', 502);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 404) throw new ColorIdeaError('المشروع غير موجود في ColorIdea', 404);
  if (res.status === 401 || res.status === 403) {
    throw new ColorIdeaError('مفتاح ColorIdea غير صالح', 502);
  }
  if (!res.ok) throw new ColorIdeaError(`ColorIdea رجّع خطأ (${res.status})`, 502);

  const json = (await res.json().catch(() => null)) as { data?: T } | null;
  if (!json || json.data === undefined) {
    throw new ColorIdeaError('رد ColorIdea غير متوقع', 502);
  }
  return json.data;
}

export async function listColorIdeaProjects(): Promise<RemoteProject[]> {
  const data = await request<RemoteProject[]>('/projects');
  return Array.isArray(data) ? data : [];
}

function normalizeMonthly(data: RemoteMonthlyData): RemoteMonthlyData {
  if (!data || !Array.isArray(data.months) || !Array.isArray(data.timeLapse)) {
    throw new ColorIdeaError('رد ColorIdea غير متوقع', 502);
  }
  const months = data.months
    .filter((m) => m && MONTH_REGEX.test(m.month))
    .map((m) => ({
      month: m.month,
      report: m.report && Array.isArray(m.report.columns) ? m.report : null,
      outputs: {
        photo: m.outputs?.photo ?? [],
        aerial: m.outputs?.aerial ?? [],
        ground: m.outputs?.ground ?? [],
        monthly_video: m.outputs?.monthly_video ?? [],
      },
    }));
  return { months, timeLapse: data.timeLapse };
}

export async function fetchProjectMonthly(externalId: string): Promise<RemoteMonthlyData> {
  if (!isValidExternalId(externalId)) throw new ColorIdeaError('معرّف مشروع ColorIdea غير صالح', 400);
  return normalizeMonthly(await request<RemoteMonthlyData>(`/projects/${externalId}/monthly`));
}




/* ============================================================
   Sync one project
   ============================================================ */
export async function syncProject(projectId: number, options: SyncOptions = {}): Promise<SyncResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, externalProjectId: true },
  });
  if (!project) throw new ColorIdeaError('المشروع غير موجود', 404);
  if (!project.externalProjectId) return { status: 'not_linked' };

  const externalId = project.externalProjectId;

  let remote: RemoteMonthlyData;
  try {
    remote = await fetchProjectMonthly(externalId);
  } catch (err) {
    // deleted in ColorIdea: we do NOTHING, the stored data stays as history
    if (err instanceof ColorIdeaError && err.status === 404) return { status: 'not_found' };
    throw err;
  }

    // an empty answer is never trusted as "everything was deleted"
  if (remote.months.length === 0 && remote.timeLapse.length === 0) {
    return { status: 'empty' };
  }
  const monthKeys = remote.months.map((m) => m.month);

  // Drive folders -> real images / video links (outside the transaction: it downloads files)
  const drive = createDriveContext(options.driveBudgetMs);
  try {
    const before = await prisma.projectMonthlyData.findMany({
      where: { projectId, source: ProjectDataSource.COLORIDEA, externalProjectId: externalId },
      select: { month: true, outputs: true },
    });
    const previousByMonth = new Map<string, Partial<Record<string, RemoteItem[]>>>();
    for (const r of before) {
      previousByMonth.set(r.month, (r.outputs ?? {}) as unknown as Partial<Record<string, RemoteItem[]>>);
    }

    for (const m of remote.months) {
      for (const section of DRIVE_SECTIONS) {
        const old = previousByMonth.get(m.month)?.[section];
        m.outputs[section] = await resolveDriveItems(m.outputs[section], Array.isArray(old) ? old : [], drive);
      }
    }
  } catch (err) {
    // the Drive import must never break the sync itself
    console.error('[drive-import] unexpected error, Drive links were kept as they are', err);
  }

  await prisma.$transaction(
    async (tx) => {
      // one sync at a time per project (two webhooks at once)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${projectId})`;

      // 1) replace (not merge) the ColorIdea record of every month in the response
      for (const m of remote.months) {
        const report = m.report
          ? (m.report as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull;
        const outputs = m.outputs as unknown as Prisma.InputJsonValue;
        await tx.projectMonthlyData.upsert({
          where: {
            projectId_month_externalProjectId: { projectId, month: m.month, externalProjectId: externalId },
          },
          create: {
            projectId,
            month: m.month,
            source: ProjectDataSource.COLORIDEA,
            externalProjectId: externalId,
            report,
            outputs,
          },
          update: { report, outputs },
        });
      }

      // 2) months ColorIdea no longer returns: delete them ONLY if no phase uses them
      await tx.projectMonthlyData.deleteMany({
        where: {
          projectId,
          source: ProjectDataSource.COLORIDEA,
          externalProjectId: externalId,
          month: { notIn: monthKeys },
          phase: null,
        },
      });

      // 3) timelapse: replace everything
      await tx.projectTimelapseItem.deleteMany({ where: { projectId } });
      if (remote.timeLapse.length > 0) {
        await tx.projectTimelapseItem.createMany({
          data: remote.timeLapse.map((item) => ({
            projectId,
            externalProjectId: externalId,
            externalItemId: item.id,
            name: item.name,
            link: item.link,
            photo: item.photo,
            date: item.date ? new Date(item.date) : null,
          })),
          skipDuplicates: true,
        });
      }

      await tx.project.update({ where: { id: projectId }, data: { lastSyncedAt: new Date() } });
    },
    { timeout: 30000 },
  );

  return {
    status: 'synced',
    months: remote.months.length,
    timelapse: remote.timeLapse.length,
    pendingImages: drive.pending,
  };
}

/** Used by the webhook: sync every linked project in the list, one by one (a failure doesn't stop the rest) */
export async function syncByExternalIds(externalIds: string[]) {
  const valid = [...new Set(externalIds.filter(isValidExternalId))];
  if (valid.length === 0) return [];

  const projects = await prisma.project.findMany({
    where: { externalProjectId: { in: valid } },
    select: { id: true, externalProjectId: true },
  });

  const results: { externalId: string; result?: SyncResult; error?: string }[] = [];
  for (const p of projects) {
    try {
      results.push({ externalId: p.externalProjectId!, result: await syncProject(p.id) });
    } catch (err) {
      results.push({ externalId: p.externalProjectId!, error: err instanceof Error ? err.message : 'error' });
    }
  }
  return results;
}

/* ============================================================
   Link / unlink
   ============================================================ */
export async function linkProject(
  projectId: number,
  externalId: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  if (!isValidExternalId(externalId)) throw new ColorIdeaError('معرّف مشروع ColorIdea غير صالح', 400);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, externalProjectId: true },
  });
  if (!project) throw new ColorIdeaError('المشروع غير موجود', 404);

  // the ColorIdea project must really exist (and belong to our company)
  const remoteProjects = await listColorIdeaProjects();
  if (!remoteProjects.some((p) => p.id === externalId)) {
    throw new ColorIdeaError('المشروع غير موجود في ColorIdea', 404);
  }

  // one ColorIdea project can be linked to one project only
  const taken = await prisma.project.findFirst({
    where: { externalProjectId: externalId, NOT: { id: projectId } },
    select: { nameAr: true },
  });
  if (taken) throw new ColorIdeaError(`المشروع مربوط بالفعل بمشروع آخر: ${taken.nameAr}`, 409);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${projectId})`;

      // ColorIdea records that come from ANOTHER ColorIdea project:
      //  - not used by a phase  -> deleted
      //  - used by a phase      -> converted to manual (history), nothing is lost
      const foreign = { projectId, source: ProjectDataSource.COLORIDEA, externalProjectId: { not: externalId } };

      await tx.projectMonthlyData.deleteMany({ where: { ...foreign, phase: null } });

      const used = await tx.projectMonthlyData.findMany({
        where: { ...foreign, phase: { isNot: null } },
        select: { id: true, externalProjectId: true },
      });
      for (const r of used) {
        await tx.projectMonthlyData.update({
          where: { id: r.id },
          data: {
            source: ProjectDataSource.MANUAL,
            externalProjectId: null,
            originNote: `منقول من ColorIdea (مشروع ${r.externalProjectId})`,
          },
        });
      }

      await tx.project.update({ where: { id: projectId }, data: { externalProjectId: externalId } });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ColorIdeaError('المشروع مربوط بالفعل بمشروع آخر', 409);
    }
    throw err;
  }

  return syncProject(projectId, options);
}

/** Unlink: the stored data stays as history, only the link is removed */
export async function unlinkProject(projectId: number) {
  await prisma.project.update({ where: { id: projectId }, data: { externalProjectId: null } });
}


/** How many phases use records of ANOTHER ColorIdea project (they become manual on linking) */
export async function countPhasesAffectedByLink(projectId: number, externalId: string) {
  return prisma.projectPhase.count({
    where: {
      projectId,
      monthlyData: { source: ProjectDataSource.COLORIDEA, externalProjectId: { not: externalId } },
    },
  });
}