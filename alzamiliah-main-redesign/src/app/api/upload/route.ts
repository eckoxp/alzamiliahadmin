import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getAuthFromRequest } from '@/lib/auth';

// خريطة: نوع الملف (MIME) -> الامتداد الآمن اللي هنحفظ بيه، إحنا
// اللي بنختاره مش الاسم اللي جاي من المستخدم، عشان محدش يقدر يمرر
// امتداد غريب (زي .html أو .php) حتى لو غيّر اسم الملف قبل الرفع
const ALLOWED_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
};

export async function POST(request: NextRequest) {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
        return NextResponse.json(
            { error: 'الرجاء تسجيل الدخول للمتابعة' },
            { status: 401 },
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type — allow images, PDFs, and videos
        // (SVG ممنوعة عمدًا: ممكن تحمل جوها JavaScript شغال، وده مخاطرة XSS)
        const ext = ALLOWED_TYPES[file.type];
        if (!ext) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: Images (jpg/png/webp/gif), PDF, Video.' }, { status: 400 });
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

        // اسم الملف بالكامل من توليدنا إحنا، مش من اسم الملف الأصلي
        // (اللي ممكن يتلاعب فيه المستخدم قبل الرفع)
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