import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '@/lib/rateLimiter';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
                { status: 400 }
            );
        }

        // مفتاح الـ rate limit: الـ IP + الإيميل، عشان محاولات كتير على
        // إيميل واحد من IP واحد تتقفل، من غير ما تأثر على حد تاني بيحاول
        // يدخل بإيميله هو من نفس الشبكة (زي عيادة/مكتب فيه IP مشترك)
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const rateLimitKey = `${ip}:${email}`;

        const { blocked, retryAfterMinutes } = checkRateLimit(rateLimitKey);
        if (blocked) {
            return NextResponse.json(
                {
                    error: `تم إجراء عدد كبير من المحاولات غير الصحيحة. يرجى المحاولة مرة أخرى بعد ${retryAfterMinutes} دقيقة.`,
                },
                { status: 429 }
            );
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            recordFailedAttempt(rateLimitKey);
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // Verify password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            recordFailedAttempt(rateLimitKey);
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // نجح تسجيل الدخول - نمسح أي سجل محاولات فاشلة قديمة
        clearAttempts(rateLimitKey);

        // Generate token
        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Set cookie
        await setAuthCookie(token);

        // ملحوظة: التوكن اتحط في كوكي httpOnly بس (فوق) - مش بيترجع في
        // الـ response body عشان مفيش داعي إن أي كود جافاسكريبت في المتصفح
        // يقدر يوصله أو يخزنه
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في تسجيل الدخول' },
            { status: 500 }
        );
    }
}