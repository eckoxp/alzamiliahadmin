import { NextRequest, NextResponse, after } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import {
  ColorIdeaError,
  RemoteProject,
  countPhasesAffectedByLink,
  isValidExternalId,
  linkProject,
  syncProject,
  listColorIdeaProjects,
  unlinkProject,
} from '@/lib/coloridea';

export const maxDuration = 60;
const DRIVE_BUDGET_MS = 40000;

type Ctx = { params: Promise<{ id: string }> };

async function getProjectId(request: NextRequest, ctx: Ctx) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return { error: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }) };
  const { id } = await ctx.params;
  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return { error: NextResponse.json({ error: 'معرّف مشروع غير صحيح' }, { status: 400 }) };
  }
  return { projectId };
}

function fail(err: unknown) {
  if (err instanceof ColorIdeaError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[coloridea-admin]', err);
  return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
}

// GET: link status + the ColorIdea projects that can still be linked
export async function GET(request: NextRequest, ctx: Ctx) {
  const r = await getProjectId(request, ctx);
  if ('error' in r) return r.error;
  const { projectId } = r;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { externalProjectId: true, lastSyncedAt: true },
  });
  if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

  const [monthsCount, timelapseCount, linkedElsewhere, phasesOnColorIdea] = await Promise.all([
    prisma.projectMonthlyData.count({ where: { projectId, source: 'COLORIDEA' } }),
    prisma.projectTimelapseItem.count({ where: { projectId } }),
    prisma.project.findMany({
      where: { externalProjectId: { not: null }, NOT: { id: projectId } },
      select: { externalProjectId: true },
    }),
     prisma.projectPhase.count({ where: { projectId, monthlyData: { source: 'COLORIDEA' } } }),
  ]);

  let remote: RemoteProject[] = [];
  let remoteError: string | null = null;
  try {
    remote = await listColorIdeaProjects();
  } catch (err) {
    remoteError = err instanceof ColorIdeaError ? err.message : 'تعذر الاتصال بـ ColorIdea';
  }

  const taken = new Set(linkedElsewhere.map((p) => p.externalProjectId));
  const current = project.externalProjectId
    ? remote.find((p) => p.id === project.externalProjectId)
    : undefined;

  return NextResponse.json({
    linked: !!project.externalProjectId,
    externalProjectId: project.externalProjectId,
    externalName: current?.name ?? null,
    existsInColorIdea: remoteError || !project.externalProjectId ? null : !!current,
    lastSyncedAt: project.lastSyncedAt,
    monthsCount,
    timelapseCount,
        phasesOnColorIdea,
    available: remote.filter((p) => !taken.has(p.id)),
    remoteError,
  });
}

// POST: link (then sync). Asks for confirmation if phases will become manual.
export async function POST(request: NextRequest, ctx: Ctx) {
  const r = await getProjectId(request, ctx);
  if ('error' in r) return r.error;
  const { projectId } = r;

  const body = await request.json().catch(() => null);
  const externalId = body?.externalProjectId;
  if (!isValidExternalId(externalId)) {
    return NextResponse.json({ error: 'معرّف مشروع ColorIdea غير صالح' }, { status: 400 });
  }

  try {
    const phases = await countPhasesAffectedByLink(projectId, externalId);
    if (phases > 0 && body?.confirm !== true) {
      return NextResponse.json({ needsConfirm: true, phases }, { status: 409 });
    }
    // linking waits at most ~40s for Drive images; anything left is finished in the background
    const result = await linkProject(projectId, externalId, { driveBudgetMs: DRIVE_BUDGET_MS });
    if (result.status === 'synced' && result.pendingImages > 0) {
      after(async () => {
        try {
          await syncProject(projectId);
        } catch (err) {
          console.error('[coloridea-link] background continuation failed', err);
        }
      });
    }
    return NextResponse.json({ success: true, result });
  } catch (err) {
    return fail(err);
  }
}

// DELETE: unlink (the stored data stays as history)
export async function DELETE(request: NextRequest, ctx: Ctx) {
  const r = await getProjectId(request, ctx);
  if ('error' in r) return r.error;

  try {
    await unlinkProject(r.projectId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return fail(err);
  }
}