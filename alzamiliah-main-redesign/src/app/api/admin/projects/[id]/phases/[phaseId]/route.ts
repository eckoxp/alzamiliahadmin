import { NextRequest, NextResponse } from 'next/server';
import { adminFail, adminIds } from '@/lib/adminApi';
import { deletePhase, updatePhase } from '@/lib/timeline';

type Ctx = { params: Promise<{ id: string; phaseId: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id', 'phaseId']);
  if ('error' in r) return r.error;
  try {
    const body = await request.json().catch(() => null);
    return NextResponse.json(await updatePhase(r.ids.id, r.ids.phaseId, body));
  } catch (err) {
    return adminFail(err, 'phases-update');
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id', 'phaseId']);
  if ('error' in r) return r.error;
  try {
    await deletePhase(r.ids.id, r.ids.phaseId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return adminFail(err, 'phases-delete');
  }
}