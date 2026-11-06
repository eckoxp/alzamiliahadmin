import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { TimelineError } from '@/lib/timeline';

/** auth + numeric id from the route; returns either the ids or a ready error response */
export async function adminIds(
  request: NextRequest,
  params: Promise<Record<string, string>>,
  names: string[],
): Promise<{ ids: Record<string, number> } | { error: NextResponse }> {
  const auth = await getAuthFromRequest(request);
  if (!auth) return { error: NextResponse.json({ error: 'غير مصرح' }, { status: 401 }) };

  const p = await params;
  const ids: Record<string, number> = {};
  for (const name of names) {
    const n = parseInt(p[name]);
    if (isNaN(n)) return { error: NextResponse.json({ error: 'معرّف غير صحيح' }, { status: 400 }) };
    ids[name] = n;
  }
  return { ids };
}

export function adminFail(err: unknown, tag: string) {
  if (err instanceof TimelineError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(`[${tag}]`, err);
  return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
}