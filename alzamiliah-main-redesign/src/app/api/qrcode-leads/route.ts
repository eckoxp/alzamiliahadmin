import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const VALID_CONTACT_METHODS = ['PHONE', 'WHATSAPP', 'EMAIL'];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, contactMethod, projectIds } = body;

        if (!name || !email || !phone || !contactMethod) {
            return NextResponse.json(
                { error: 'Name, email, phone, and contact method are required' },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        if (!VALID_CONTACT_METHODS.includes(contactMethod)) {
            return NextResponse.json({ error: 'Invalid contact method' }, { status: 400 });
        }

        const ids: number[] = Array.isArray(projectIds)
            ? projectIds.map((id: unknown) => parseInt(String(id))).filter((id: number) => !isNaN(id))
            : [];

        const lead = await prisma.$transaction(async (tx) => {
            const newLead = await tx.qrCodeLead.create({
                data: { name, email, phone, contactMethod, status: 'new' },
            });
            if (ids.length > 0) {
                await tx.qrCodeLeadProject.createMany({
                    data: ids.map(projectId => ({ leadId: newLead.id, projectId })),
                });
            }
            return newLead;
        });

        return NextResponse.json({ success: true, id: lead.id });
    } catch (error) {
        console.error('QR lead error:', error);
        return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
    }
}