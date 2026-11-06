import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/auth';
import { getDashboardStats } from '@/lib/dashboardStats';

export async function GET(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        return NextResponse.json(await getDashboardStats());
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}