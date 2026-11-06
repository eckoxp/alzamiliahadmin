import { NextRequest, NextResponse, after } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { ColorIdeaError, syncProject } from '@/lib/coloridea';

export const maxDuration = 60;
const DRIVE_BUDGET_MS = 40000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { id } = await params;
  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'معرّف مشروع غير صحيح' }, { status: 400 });
  }

  try {
    // the button waits at most ~40s for Drive images; anything left is finished in the background
    const result = await syncProject(projectId, { driveBudgetMs: DRIVE_BUDGET_MS });
    if (result.status === 'not_linked') {
      return NextResponse.json({ error: 'المشروع غير مربوط بـ ColorIdea' }, { status: 400 });
    }
    if (result.status === 'synced' && result.pendingImages > 0) {
      after(async () => {
        try {
          await syncProject(projectId);
        } catch (err) {
          console.error('[coloridea-sync] background continuation failed', err);
        }
      });
    }
    return NextResponse.json({ success: true, result });
  } catch (err) {
    if (err instanceof ColorIdeaError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[coloridea-sync]', err);
    return NextResponse.json({ error: 'فشلت المزامنة' }, { status: 500 });
  }
}