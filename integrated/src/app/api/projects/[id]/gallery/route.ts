import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Add a gallery image
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const projectId = parseInt(id);
        const body = await request.json();

        if (!body.url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Get the next sort order
        const lastImage = await prisma.projectImage.findFirst({
            where: { projectId },
            orderBy: { sortOrder: 'desc' },
        });
        const sortOrder = (lastImage?.sortOrder ?? -1) + 1;

        const image = await prisma.projectImage.create({
            data: {
                projectId,
                url: body.url,
                sortOrder,
            },
        });

        return NextResponse.json(image, { status: 201 });
    } catch (error) {
        console.error('Error adding gallery image:', error);
        return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
    }
}

// DELETE - Remove a gallery image by image ID (passed as query param)
export async function DELETE(
    request: NextRequest,
) {
    try {
        const { searchParams } = new URL(request.url);
        const imageId = parseInt(searchParams.get('imageId') || '');

        if (isNaN(imageId)) {
            return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
        }

        await prisma.projectImage.delete({
            where: { id: imageId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting gallery image:', error);
        return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }
}
