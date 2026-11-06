import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

// GET - Single project (admin, all fields)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const projectId = parseInt(id);
        if (isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                apartments: true,
                galleryImages: { orderBy: { sortOrder: 'asc' } },
            },
        });

        if (!project) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
    }
}

// PUT - Update project
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const projectId = parseInt(id);
        if (isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const body = await request.json();

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                nameAr: body.nameAr,
                nameEn: body.nameEn,
                type: body.type,
                descriptionAr: body.descriptionAr,
                descriptionEn: body.descriptionEn,
                excerptAr: body.excerptAr,
                excerptEn: body.excerptEn,
                image: body.image,
                image2: body.image2,
                image3: body.image3,
                image4: body.image4,
                image5: body.image5,
                image6: body.image6,
                buildingsCount: body.buildingsCount != null ? parseInt(body.buildingsCount) : undefined,
                unitsCount: body.unitsCount != null ? parseInt(body.unitsCount) : undefined,
                elevatorsCount: body.elevatorsCount != null ? parseInt(body.elevatorsCount) : undefined,
                sortOrder: body.sortOrder != null ? parseInt(body.sortOrder) : undefined,
                locationAr: body.locationAr,
                locationEn: body.locationEn,
                address: body.address,
                linkLocation: body.linkLocation,
                linkProject: body.linkProject,
                linkMap: body.linkMap,
                videoLink: body.videoLink,
                livePreview: body.livePreview,
                city: body.city,
                lat: body.lat != null ? parseFloat(body.lat) : undefined,
                lng: body.lng != null ? parseFloat(body.lng) : undefined,
                status: body.status != null ? parseInt(body.status) : undefined,
                statusApartment: body.statusApartment != null ? parseInt(body.statusApartment) : undefined,
                availability: body.availability != null ? parseInt(body.availability) : undefined,
                isFeatured: body.isFeatured != null ? parseInt(body.isFeatured) : undefined,
                // Guarantees as numbers (years)
                elec: body.elec != null ? parseInt(body.elec) : undefined,
                devices: body.devices != null ? parseInt(body.devices) : undefined,
                elevator: body.elevator != null ? parseInt(body.elevator) : undefined,
                air: body.air != null ? parseInt(body.air) : undefined,
                plumber: body.plumber != null ? parseInt(body.plumber) : undefined,
                house: body.house != null ? parseInt(body.house) : undefined,
                highQuality: body.highQuality != null ? parseInt(body.highQuality) : undefined,
                smartEntry: body.smartEntry != null ? parseInt(body.smartEntry) : undefined,
                fireSensor: body.fireSensor != null ? parseInt(body.fireSensor) : undefined,
                // Additional fields
                icon3d: body.icon3d,
                iconFollow: body.iconFollow,
                buildYear: body.buildYear != null ? String(body.buildYear) : undefined,
                sqFit: body.sqFit != null ? String(body.sqFit) : undefined,
                projectFile: body.projectFile,
                projectFile2: body.projectFile2,
                projectFile3: body.projectFile3,
                video: body.video,
            },
        });

        return NextResponse.json({ success: true, project });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'فشل في تحديث المشروع' }, { status: 500 });
    }
}

// DELETE - Delete project
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const projectId = parseInt(id);
        if (isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await prisma.project.delete({
            where: { id: projectId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: 'فشل في حذف المشروع' }, { status: 500 });
    }
}
