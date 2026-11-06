import { readFile } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-static';

export async function GET() {
    const html = await readFile(
        join(process.cwd(), 'src', 'content', 'invitation.html'),
        'utf-8'
    );

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
    });
}