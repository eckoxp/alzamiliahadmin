import { NextRequest, NextResponse } from 'next/server';
import { adminFail, adminIds } from '@/lib/adminApi';
import { createPhase, listPhases } from '@/lib/timeline';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id']);
  if ('error' in r) return r.error;
  try {
    return NextResponse.json(await listPhases(r.ids.id));
  } catch (err) {
    return adminFail(err, 'phases-list');
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  const r = await adminIds(request, params, ['id']);
  if ('error' in r) return r.error;
  try {
    const body = await request.json().catch(() => null);
    return NextResponse.json(await createPhase(r.ids.id, body), { status: 201 });
  } catch (err) {
    return adminFail(err, 'phases-create');
  }
}