import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const [projectsCount, contactCount, visitorsCount] = await Promise.all([
            prisma.project.count(),
            prisma.contactRequest.count(),
            prisma.visitor.count(),
        ]);

        return NextResponse.json({
            projects_count: projectsCount,
            contact_count: contactCount,
            total_visitors: visitorsCount,
            inquiries_count: 0,
            monthly_stats: {
                list_visitors: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                list_visitors_sa: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}
