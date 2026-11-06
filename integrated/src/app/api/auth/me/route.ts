import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const payload = await requireAuth();
        if (!payload) {
            return NextResponse.json(
                { error: 'غير مصرح' },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'المستخدم غير موجود' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { error: 'حدث خطأ' },
            { status: 500 }
        );
    }
}
