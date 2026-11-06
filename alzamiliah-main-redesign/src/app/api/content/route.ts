import { type NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';


export async function GET() {
    try {
        const pages = await prisma.contentPage.findMany({
            orderBy: { slug: 'asc' },
        });
        return NextResponse.json({ pages });
    } catch (error) {
        console.error('Error fetching content pages:', error);
        return NextResponse.json({ pages: [] });
    }
}

export async function POST(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json(
            { error: 'الرجاء تسجيل الدخول للمتابعة' },
            { status: 401 },
        );
    }

    try {
        const body = await request.json();
        const { slug, titleAr, titleEn, contentAr, contentEn } = body;

        const page = await prisma.contentPage.upsert({
            where: { slug },
            update: { titleAr, titleEn, contentAr, contentEn },
            create: { slug, titleAr, titleEn, contentAr, contentEn },
        });

        return NextResponse.json({ page });
    } catch (error) {
        console.error('Error saving content page:', error);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}