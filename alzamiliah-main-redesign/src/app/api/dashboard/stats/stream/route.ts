import { NextRequest } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { getDashboardStats } from '@/lib/dashboardStats';
import { visitorEvents, NEW_VISITOR_EVENT } from '@/lib/visitorEvents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return new Response('غير مصرح', { status: 401 });
    }

    const encoder = new TextEncoder();
    let cleanup = () => {};

    const stream = new ReadableStream({
        async start(controller) {
            let closed = false;
            let timer: ReturnType<typeof setTimeout> | null = null;

            const send = async () => {
                if (closed) return;
                try {
                    const stats = await getDashboardStats();
                    if (closed) return;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
                } catch (e) {
                    console.error('stats stream error:', e);
                }
            };

            // لو دخل كذا زائر في نفس اللحظة نبعت تحديث واحد بس
            const onVisitor = () => {
                if (timer) return;
                timer = setTimeout(() => {
                    timer = null;
                    send();
                }, 500);
            };

            // نبضة كل 25 ثانية عشان Nginx ما يقفلش الاتصال
            const heartbeat = setInterval(() => {
                if (!closed) controller.enqueue(encoder.encode(': ping\n\n'));
            }, 25_000);

            visitorEvents.on(NEW_VISITOR_EVENT, onVisitor);

            cleanup = () => {
                if (closed) return;
                closed = true;
                clearInterval(heartbeat);
                if (timer) clearTimeout(timer);
                visitorEvents.off(NEW_VISITOR_EVENT, onVisitor);
                try { controller.close(); } catch {}
            };

            request.signal.addEventListener('abort', cleanup);

            await send(); // أول رسالة فورًا عند الاتصال
        },
        cancel() {
            cleanup();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}