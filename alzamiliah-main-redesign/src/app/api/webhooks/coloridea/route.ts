import crypto from 'crypto';
import { NextRequest, NextResponse, after } from 'next/server';
import { isValidExternalId, syncByExternalIds } from '@/lib/coloridea';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // lets the background sync finish (matters on Vercel)

const MAX_BODY_BYTES = 100 * 1024; // the real message is tiny
const MAX_AGE_SECONDS = 5 * 60; // replay protection window
const MAX_IDS = 100;

/** signature = HMAC_SHA256(secret, `${timestamp}.${rawBody}`), sent as "sha256=<hex>" */
function verifySignature(secret: string, timestamp: string, rawBody: string, header: string): boolean {
  const received = header.startsWith('sha256=') ? header.slice(7) : '';
  if (!/^[0-9a-f]{64}$/i.test(received)) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(received, 'hex'));
}

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function POST(req: NextRequest) {
  const secret = process.env.COLORIDEA_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[coloridea-webhook] COLORIDEA_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // 1) raw body FIRST (the signature is computed on the exact text)
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  // 2) timestamp (rejects old or future messages)
  const timestamp = req.headers.get('x-coloridea-timestamp') ?? '';
  if (!/^\d{1,12}$/.test(timestamp)) return unauthorized();
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (ageSeconds > MAX_AGE_SECONDS) return unauthorized();

  // 3) signature
  const signature = req.headers.get('x-coloridea-signature') ?? '';
  if (!verifySignature(secret, timestamp, rawBody, signature)) return unauthorized();

  // 4) message shape (only after the signature is proven)
  let body: { event?: unknown; projectIds?: unknown };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.event !== 'projects.changed' || !Array.isArray(body.projectIds)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const ids = [...new Set(body.projectIds.filter(isValidExternalId))];
  if (ids.length === 0 || ids.length > MAX_IDS) {
    return NextResponse.json({ error: 'Invalid projectIds' }, { status: 400 });
  }

  // 5) answer fast, sync in the background (ids we don't have linked are ignored)
  after(async () => {
    try {
      const results = await syncByExternalIds(ids);
       console.log(`[coloridea-webhook] received ${ids.length} id(s), linked: ${results.length}`);
      for (const r of results) {
        if (r.error) console.error(`[coloridea-webhook] sync failed for ${r.externalId}: ${r.error}`);
        else console.log(`[coloridea-webhook] ${r.externalId}: ${r.result?.status}`);
      }
    } catch (err) {
      console.error('[coloridea-webhook] background sync crashed', err);
    }
  });

  return NextResponse.json({ received: true }, { status: 202 });
}