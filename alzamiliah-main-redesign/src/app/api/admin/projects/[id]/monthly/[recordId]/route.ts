import { NextRequest, NextResponse } from 'next/server';
import { adminFail, adminIds } from '@/lib/adminApi';
import { deleteMonthly, updateManualMonthly } from '@/lib/timeline';

type Ctx = { params: Promise<{ id: string; recordId: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id', 'recordId']);
  if ('error' in r) return r.error;
  try {
    const body = await request.json().catch(() => null);
    return NextResponse.json(await updateManualMonthly(r.ids.id, r.ids.recordId, body));
  } catch (err) {
    return adminFail(err, 'monthly-update');
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id', 'recordId']);
  if ('error' in r) return r.error;
  try {
    await deleteMonthly(r.ids.id, r.ids.recordId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return adminFail(err, 'monthly-delete');
  }
}