import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

// GET - List all projects (admin)
export async function GET(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const projects = await prisma.project.findMany({
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { apartments: true },
                },
            },
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json([], { status: 500 });
    }
}

// POST - Create new project (admin)
export async function POST(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Auto-calculate sortOrder if not provided
        const maxSort = await prisma.project.aggregate({ _max: { sortOrder: true } });
        const nextSort = (maxSort._max.sortOrder ?? -1) + 1;

        const project = await prisma.project.create({
            data: {
                nameAr: body.nameAr,
                nameEn: body.nameEn || null,
                type: body.type || null,
                descriptionAr: body.descriptionAr || null,
                descriptionEn: body.descriptionEn || null,
                excerptAr: body.excerptAr || null,
                excerptEn: body.excerptEn || null,
                image: body.image || null,
                image2: body.image2 || null,
                image3: body.image3 || null,
                image4: body.image4 || null,
                image5: body.image5 || null,
                image6: body.image6 || null,
                buildingsCount: body.buildingsCount ? parseInt(body.buildingsCount) : null,
                unitsCount: body.unitsCount ? parseInt(body.unitsCount) : null,
                elevatorsCount: body.elevatorsCount ? parseInt(body.elevatorsCount) : null,
                sortOrder: body.sortOrder ? parseInt(body.sortOrder) : nextSort,
                locationAr: body.locationAr || null,
                locationEn: body.locationEn || null,
                address: body.address || null,
                linkLocation: body.linkLocation || null,
                linkProject: body.linkProject || null,
                linkMap: body.linkMap || null,
                videoLink: body.videoLink || null,
                livePreview: body.livePreview || null,
                city: body.city || null,
                lat: body.lat ? parseFloat(body.lat) : null,
                lng: body.lng ? parseFloat(body.lng) : null,
                status: body.status !== undefined ? parseInt(body.status) : 1,
                statusApartment: body.statusApartment !== undefined ? parseInt(body.statusApartment) : 1,
                availability: body.availability !== undefined ? parseInt(body.availability) : 1,
                isFeatured: body.isFeatured ? parseInt(body.isFeatured) : 0,
                // Guarantees as number values (years)
                elec: parseInt(body.elec) || 0,
                devices: parseInt(body.devices) || 0,
                elevator: parseInt(body.elevator) || 0,
                air: parseInt(body.air) || 0,
                plumber: parseInt(body.plumber) || 0,
                house: parseInt(body.house) || 0,
                highQuality: parseInt(body.highQuality) || 0,
                smartEntry: parseInt(body.smartEntry) || 0,
                fireSensor: parseInt(body.fireSensor) || 0,
                // Additional fields
                icon3d: body.icon3d || null,
                iconFollow: body.iconFollow || null,
                buildYear: body.buildYear ? String(body.buildYear) : null,
                sqFit: body.sqFit ? String(body.sqFit) : null,
                projectFile: body.projectFile || null,
                projectFile2: body.projectFile2 || null,
                projectFile3: body.projectFile3 || null,
                video: body.video || null,
            },
        });

        // Create gallery images if provided
        if (body.galleryImages && Array.isArray(body.galleryImages)) {
            for (let i = 0; i < body.galleryImages.length; i++) {
                await prisma.projectImage.create({
                    data: {
                        projectId: project.id,
                        url: body.galleryImages[i],
                        sortOrder: i,
                    },
                });
            }
        }

        return NextResponse.json({ success: true, project });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء المشروع' },
            { status: 500 }
        );
    }
}

