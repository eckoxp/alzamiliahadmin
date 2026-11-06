import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const contacts = await prisma.contactRequest.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(contacts);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const contact = await prisma.contactRequest.update({
            where: { id: body.id },
            data: { status: body.status },
        });
        return NextResponse.json({ success: true, contact });
    } catch (error) {
        console.error('Error updating contact:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const body = await request.json();
        await prisma.contactRequest.delete({
            where: { id: body.id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting contact:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
