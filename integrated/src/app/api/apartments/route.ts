import { type NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const projectId = request.nextUrl.searchParams.get('projectId');

    try {
        const apartments = await prisma.apartment.findMany({
            where: projectId ? { projectId: parseInt(projectId) } : {},
            orderBy: [
                { buildingName: 'asc' },
                { apartmentNumber: 'asc' },
                { floor: 'asc' },
            ],
        });
        return NextResponse.json({ apartments });
    } catch (error) {
        console.error('Error fetching apartments:', error);
        return NextResponse.json({ apartments: [] });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const apartment = await prisma.apartment.create({
            data: {
                nameAr: body.nameAr || `الشقة ${body.apartmentNumber || ''}`,
                nameEn: body.nameEn || null,
                buildingName: body.buildingName || null,
                floor: body.floor ?? null,
                area: body.area ?? null,
                bedrooms: body.bedrooms ?? null,
                bathrooms: body.bathrooms ?? null,
                price: body.price ?? null,
                status: body.status || 'available',
                projectId: body.projectId,
                type: body.type || 'A',
                apartmentNumber: body.apartmentNumber ?? null,
                image: body.image || null,
                livingRoom: body.livingRoom ?? 0,
                kitchen: body.kitchen ?? 0,
                driverRoom: body.driverRoom ?? 0,
                maidRoom: body.maidRoom ?? 0,
                balcony: body.balcony ?? 0,
                parking: body.parking ?? 0,
                cars: body.cars ?? 0,
                garden: body.garden ?? 0,
                entrance: body.entrance ?? 0,
                majlis: body.majlis ?? 0,
                storage: body.storage ?? 0,
            },
        });
        return NextResponse.json({ apartment });
    } catch (error) {
        console.error('Error creating apartment:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
