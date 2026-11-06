import { type NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const apartment = await prisma.apartment.update({
            where: { id: parseInt(id) },
            data: {
                nameAr: body.nameAr || undefined,
                nameEn: body.nameEn ?? undefined,
                buildingName: body.buildingName ?? undefined,
                floor: body.floor ?? undefined,
                area: body.area ?? undefined,
                bedrooms: body.bedrooms ?? undefined,
                bathrooms: body.bathrooms ?? undefined,
                price: body.price ?? undefined,
                status: body.status || undefined,
                type: body.type ?? undefined,
                apartmentNumber: body.apartmentNumber ?? undefined,
                image: body.image ?? undefined,
                livingRoom: body.livingRoom ?? undefined,
                kitchen: body.kitchen ?? undefined,
                driverRoom: body.driverRoom ?? undefined,
                maidRoom: body.maidRoom ?? undefined,
                balcony: body.balcony ?? undefined,
                parking: body.parking ?? undefined,
                cars: body.cars ?? undefined,
                garden: body.garden ?? undefined,
                entrance: body.entrance ?? undefined,
                majlis: body.majlis ?? undefined,
                storage: body.storage ?? undefined,
            },
        });
        return NextResponse.json({ apartment });
    } catch (error) {
        console.error('Error updating apartment:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.apartment.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting apartment:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
