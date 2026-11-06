import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MIME_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const filePath = path.join('/');

    // Security: block path traversal
    if (filePath.includes('..') || filePath.includes('~')) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);

    if (!existsSync(fullPath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
        const fileBuffer = await readFile(fullPath);
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }
}
