import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, phone, message, projectId } = body;

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            );
        }

        // Save to database
        const contactRequest = await prisma.contactRequest.create({
            data: {
                name,
                email,
                phone: phone || null,
                message,
                projectId: projectId ? parseInt(projectId) : null,
                status: 'new',
            },
        });

        return NextResponse.json({
            success: true,
            id: contactRequest.id,
            message: 'Contact request submitted successfully'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Failed to submit contact request' },
            { status: 500 }
        );
    }
}
