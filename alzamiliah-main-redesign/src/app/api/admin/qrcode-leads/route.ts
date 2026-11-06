import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const leads = await prisma.qrCodeLead.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                projects: {
                    include: {
                        project: {
                            select: { id: true, nameAr: true, nameEn: true, locationAr: true, locationEn: true },
                        },
                    },
                },
            },
        });
        return NextResponse.json(leads);
    } catch (error) {
        console.error(error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, status } = await request.json();
        const lead = await prisma.qrCodeLead.update({ where: { id }, data: { status } });
        return NextResponse.json({ success: true, lead });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await request.json();
        await prisma.qrCodeLead.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}