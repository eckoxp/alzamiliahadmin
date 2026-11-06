import { NextRequest, NextResponse } from 'next/server';
import { adminFail, adminIds } from '@/lib/adminApi';
import { createManualMonthly, listMonthly } from '@/lib/timeline';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id']);
  if ('error' in r) return r.error;
  try {
    return NextResponse.json(await listMonthly(r.ids.id));
  } catch (err) {
    return adminFail(err, 'monthly-list');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id']);
  if ('error' in r) return r.error;
  try {
    const body = await request.json().catch(() => null);
    const record = await createManualMonthly(r.ids.id, body);
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return adminFail(err, 'monthly-create');
  }
}