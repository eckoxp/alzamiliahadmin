import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type — allow images, PDFs, and videos
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
            'application/pdf',
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: Images, PDF, Video.' }, { status: 400 });
        }

        // Validate file size (max 50MB for videos, 10MB for others)
        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: `File too large. Maximum ${file.type.startsWith('video/') ? '50MB' : '10MB'}.` }, { status: 400 });
        }

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'projects');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'bin';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filepath = join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        // Return the public URL
        const url = `/uploads/projects/${filename}`;
        return NextResponse.json({ url, filename });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
