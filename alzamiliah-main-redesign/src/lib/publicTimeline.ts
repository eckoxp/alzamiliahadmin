import prisma from './prisma';
import { toMediaView, type MediaView } from './embed';

/* ============================================================
   What a VISITOR sees of a project's timeline (server only).
   Reads phases + their monthly record and shapes them for the public pages:
   no internal fields (record ids, source, origin note, external ids ...).
   Sections without data are simply empty/null, the page hides them.
   ============================================================ */

export interface PhaseMetric {
  name: string;
  value: number;
}

export interface PhaseCard {
  id: number;
  month: string; // "2026-10"
  coverImage: string;
  isLatest: boolean;
  total: number | null; // "الإجمالي الفعلي"
  metrics: PhaseMetric[]; // the other percent columns
}

export interface MediaItem {
  id: string;
  name: string;
  view: MediaView;
}

export interface PhaseDetail extends PhaseCard {
  updatedAt: string;
  numbers: PhaseMetric[]; // columns of type "number"
  notes: string | null;
  notesEn: string | null;
  reading: string | null;
  readingEn: string | null;
  upcoming: string | null;
  upcomingEn: string | null;
  extraTexts: { name: string; value: string }[];
  monthlyVideo: MediaView | null; // the FIRST playable one
  aerial: MediaItem[];
  ground: MediaItem[];
  photo: MediaItem[];
  timelapse: MediaView | null; // the FIRST playable one
}

export interface PublicTimeline {
  phases: PhaseCard[];
  /** project level timelapse (from ColorIdea): the FIRST playable one */
  timelapse: { name: string; view: MediaView } | null;
}

export interface PublicPhase {
  project: { id: number; nameAr: string; nameEn: string | null };
  phase: PhaseDetail;
  others: PhaseCard[];
}

const MAX_GALLERY = 60;

/* ---------- report parsing ---------- */

interface Column {
  name: string;
  type: string;
  value: unknown;
  valueEn: unknown;
}

function columnsOf(report: unknown): Column[] {
  const cols = (report as { columns?: unknown } | null)?.columns;
  if (!Array.isArray(cols)) return [];
  return cols
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({ name: typeof c.name === 'string' ? c.name.trim() : '', type: String(c.type ?? ''), value: c.value, valueEn: c.valueEn }))
    .filter((c) => c.name);
}

// same word with different spelling must match (أ/إ/آ، ة/ه، ى/ي)
const norm = (s: string) =>
  s
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();

function toNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function shapeReport(report: unknown) {
  const cols = columnsOf(report);
  let total: number | null = null;
  const metrics: PhaseMetric[] = [];
  const numbers: PhaseMetric[] = [];
  let notes: string | null = null;
  let notesEn: string | null = null;
  let reading: string | null = null;
  let readingEn: string | null = null;
  let upcoming: string | null = null;
  let upcomingEn: string | null = null;
  const extraTexts: { name: string; value: string }[] = [];

  for (const c of cols) {
    const n = norm(c.name);
    if (c.type === 'percent' || c.type === 'number') {
      const value = toNumber(c.value);
      if (value === null) continue;
      if (c.type === 'percent') {
        if (total === null && n.includes('الاجمالي') && n.includes('الفعلي')) total = value;
        else metrics.push({ name: c.name, value });
      } else {
        numbers.push({ name: c.name, value });
      }
    } else if (c.type === 'text') {
      const text = typeof c.value === 'string' ? c.value.trim() : '';
      const english = typeof c.valueEn === 'string' ? c.valueEn.trim() || null : null;
      if (!text && !english) continue;
      if (notes === null && n.includes('ملاحظ')) { notes = text || null; notesEn = english; }
      else if (reading === null && n.includes('قراءه')) { reading = text || null; readingEn = english; }
      else if (upcoming === null && n.includes('القادمه')) { upcoming = text || null; upcomingEn = english; }
      else extraTexts.push({ name: c.name, value: text });
    }
  }
  return { total, metrics, numbers, notes, reading, upcoming, notesEn, readingEn, upcomingEn, extraTexts };
}

/* ---------- outputs parsing ---------- */

interface RawItem {
  id?: unknown;
  name?: unknown;
  link?: unknown;
}

function itemsOf(outputs: unknown, key: string): RawItem[] {
  const list = (outputs as Record<string, unknown> | null)?.[key];
  return Array.isArray(list) ? (list.filter((x) => x && typeof x === 'object') as RawItem[]) : [];
}

function gallery(outputs: unknown, key: string): MediaItem[] {
  const out: MediaItem[] = [];
  itemsOf(outputs, key).forEach((it, i) => {
    const view = toMediaView(typeof it.link === 'string' ? it.link : null);
    if (!view) return;
    out.push({
      id: typeof it.id === 'string' && it.id ? it.id : `${key}-${i}`,
      name: typeof it.name === 'string' ? it.name.trim() : '',
      view,
    });
  });
  return out.slice(0, MAX_GALLERY);
}

/** the first item that can be PLAYED (video file or embed), never a picture */
function firstPlayable(outputs: unknown, key: string): MediaView | null {
  for (const it of itemsOf(outputs, key)) {
    const view = toMediaView(typeof it.link === 'string' ? it.link : null);
    if (view && view.kind !== 'image') return view;
  }
  return null;
}

/* ---------- queries ---------- */

const phaseOrder = [{ monthlyData: { month: 'desc' as const } }, { createdAt: 'desc' as const }];

function toCard(p: {
  id: number;
  coverImage: string;
  isLatest: boolean;
  monthlyData: { month: string; report: unknown };
}): PhaseCard {
  const { total, metrics } = shapeReport(p.monthlyData.report);
  return { id: p.id, month: p.monthlyData.month, coverImage: p.coverImage, isLatest: p.isLatest, total, metrics };
}

async function listCards(projectId: number): Promise<PhaseCard[]> {
  const rows = await prisma.projectPhase.findMany({
    where: { projectId },
    orderBy: phaseOrder,
    select: {
      id: true,
      coverImage: true,
      isLatest: true,
      monthlyData: { select: { month: true, report: true } },
    },
  });
  return rows.map(toCard);
}

/** the project level timelapse (from ColorIdea): the FIRST one that can be played */
async function projectTimelapse(projectId: number): Promise<PublicTimeline['timelapse']> {
  const rows = await prisma.projectTimelapseItem.findMany({ where: { projectId }, orderBy: { id: 'asc' } });
  for (const row of rows) {
    const view = toMediaView(row.link);
    if (view && view.kind !== 'image') return { name: row.name, view };
  }
  return null;
}

export async function getPublicTimeline(projectId: number): Promise<PublicTimeline> {
  const [phases, timelapse] = await Promise.all([listCards(projectId), projectTimelapse(projectId)]);
  return { phases, timelapse };
}

export async function getPublicPhase(projectId: number, phaseId: number): Promise<PublicPhase | null> {
  const row = await prisma.projectPhase.findFirst({
    where: { id: phaseId, projectId }, // a phase of ANOTHER project is never returned
    select: {
      id: true,
      coverImage: true,
      isLatest: true,
      project: { select: { id: true, nameAr: true, nameEn: true } },
      monthlyData: { select: { month: true, report: true, outputs: true, updatedAt: true } },
    },
  });
  if (!row) return null;

  const base = toCard(row);
  const shaped = shapeReport(row.monthlyData.report);
  const o = row.monthlyData.outputs;

  const phase: PhaseDetail = {
    ...base,
    updatedAt: row.monthlyData.updatedAt.toISOString(),
    numbers: shaped.numbers,
    notes: shaped.notes,
    notesEn: shaped.notesEn,
    reading: shaped.reading,
    readingEn: shaped.readingEn,
    upcoming: shaped.upcoming,
    upcomingEn: shaped.upcomingEn,
    extraTexts: shaped.extraTexts,
    monthlyVideo: firstPlayable(o, 'monthly_video'),
    aerial: gallery(o, 'aerial'),
    ground: gallery(o, 'ground'),
    photo: gallery(o, 'photo'),
    // the record's own timelapse first, else the project's first ColorIdea timelapse
    timelapse: firstPlayable(o, 'timelapse') ?? (await projectTimelapse(projectId))?.view ?? null,
  };

  const all = await listCards(projectId);
  return { project: row.project, phase, others: all.filter((c) => c.id !== phaseId) };
}