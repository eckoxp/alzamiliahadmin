import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { getCountryCode } from '@/lib/geo';
import { visitorEvents, NEW_VISITOR_EVENT } from '@/lib/visitorEvents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIMEZONE = 'Asia/Riyadh';
const BOT_REGEX = /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget|python-requests|monitor|uptime|facebookexternalhit/i;

// الصفحات العامة المسموح بتسجيلها (من غير اللغة). أي مسار تاني بيتجاهل.
const PUBLIC_PATHS = new Set(['/', '/about', '/contact', '/projects', '/qrcode', '/privacy', '/terms']);

// throttle بسيط: 60 طلب في الدقيقة لكل IP
const hits = new Map<string, { count: number; resetAt: number }>();
function isThrottled(ip: string) {
    const now = Date.now();
    if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    }
    const rec = hits.get(ip);
    if (!rec || rec.resetAt < now) {
        hits.set(ip, { count: 1, resetAt: now + 60_000 });
        return false;
    }
    rec.count++;
    return rec.count > 60;
}

// تاريخ النهارده بتوقيت الرياض، كـ Date على منتصف الليل UTC (مناسب لـ @db.Date)
function riyadhToday() {
    const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date()); // 2026-10-12
    return new Date(`${ymd}T00:00:00.000Z`);
}

function getIp(req: NextRequest) {
    const raw =
        req.headers.get('x-real-ip') ||
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown';
    return raw.replace(/^::ffff:/, '');
}

// بيشيل اللغة والـ query ويرجّع المسار الموحّد، أو null لو الصفحة مش من الصفحات العامة
function normalizePath(raw: string | null): { path: string; projectId: number | null } | null {
    if (!raw) return null;
    let p = raw.split(/[?#]/)[0];
    p = p.replace(/^\/(ar|en)(?=\/|$)/, '');
    if (p === '') p = '/';
    if (p.length > 1) p = p.replace(/\/+$/, '');

    if (PUBLIC_PATHS.has(p)) return { path: p, projectId: null };

    const m = /^\/projects\/(\d{1,9})$/.exec(p);
    if (m) return { path: `/projects/${m[1]}`, projectId: Number(m[1]) };

    return null;
}

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002';

export async function POST(request: NextRequest) {
    try {
        const ip = getIp(request);
        const userAgent = (request.headers.get('user-agent') || '').slice(0, 300);

        // نتجاهل البوتات والطلبات من غير userAgent
        if (!userAgent || BOT_REGEX.test(userAgent)) {
            return NextResponse.json({ ok: true, counted: false });
        }
        if (isThrottled(ip)) {
            return NextResponse.json({ ok: false }, { status: 429 });
        }

        let page: string | null = null;
        try {
            const body = await request.json();
            if (typeof body?.page === 'string' && body.page.startsWith('/')) {
                page = body.page.slice(0, 200);
            }
        } catch {}

        const visitDate = riyadhToday();
        const salt = process.env.VISITOR_SALT || 'alzamiliah-visitor-salt';
        const visitorKey = createHash('sha256').update(`${ip}|${userAgent}|${salt}`).digest('hex');

        let visitorCounted = false;
        let viewCounted = false;

        // ١) الزائر الفريد في اليوم
        const existingVisitor = await prisma.visitor.findFirst({
            where: { visitorKey, visitDate },
            select: { id: true },
        });

        if (!existingVisitor) {
            const country = await getCountryCode(ip);
            try {
                await prisma.visitor.create({
                    data: { ip, country, userAgent, page, visitorKey, visitDate },
                });
                visitorCounted = true;
            } catch (e) {
                // طلبين في نفس اللحظة: الـ unique في الداتابيز منع التكرار، وده مش خطأ
                if (!isUniqueViolation(e)) throw e;
            }
        }

        // ٢) مشاهدة الصفحة: مرة واحدة لكل زائر لكل صفحة في اليوم
        const target = normalizePath(page);
        if (target) {
            const existingView = await prisma.pageView.findFirst({
                where: { visitorKey, path: target.path, viewDate: visitDate },
                select: { id: true },
            });

            if (!existingView) {
                // نتأكد إن المشروع موجود فعلًا قبل ما نسجل له مشاهدة
                let allowed = true;
                if (target.projectId !== null) {
                    const project = await prisma.project.findUnique({
                        where: { id: target.projectId },
                        select: { id: true },
                    });
                    allowed = !!project;
                }

                if (allowed) {
                    try {
                        await prisma.pageView.create({
                            data: {
                                visitorKey,
                                path: target.path,
                                projectId: target.projectId,
                                viewDate: visitDate,
                            },
                        });
                        viewCounted = true;
                    } catch (e) {
                        if (!isUniqueViolation(e)) throw e;
                    }
                }
            }
        }

        if (visitorCounted || viewCounted) {
            visitorEvents.emit(NEW_VISITOR_EVENT);
        }
        return NextResponse.json({ ok: true, counted: visitorCounted, viewCounted });
    } catch (error) {
        console.error('track error:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}