import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);

        if (isNaN(projectId)) {
            return NextResponse.json(
                { error: 'Invalid project ID' },
                { status: 400 }
            );
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                apartments: {
                    orderBy: [
                        { buildingName: 'asc' },
                        { floor: 'asc' },
                    ],
                },
                galleryImages: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        );
    }
}
