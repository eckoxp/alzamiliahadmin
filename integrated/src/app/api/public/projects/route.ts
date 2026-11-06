import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            where: {
                status: { in: [0, 1, 3, 4] }
            },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                nameAr: true,
                nameEn: true,
                image: true,
                locationAr: true,
                locationEn: true,
                buildingsCount: true,
                unitsCount: true,
                status: true,
                statusApartment: true,
                city: true,
                lat: true,
                lng: true,
                type: true,
                linkMap: true,
            }
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json([], { status: 500 });
    }
}
