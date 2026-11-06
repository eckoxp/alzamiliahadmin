'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'az_tracked_paths';

export default function VisitorTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // مانسجلش صفحات الأدمن (المسار بيبدأ باللغة: /ar/admin أو /en/admin)
        if (!pathname || /^\/(ar|en)\/admin(\/|$)/.test(pathname)) return;

        // نفس الصفحة ما نبعتهاش تاني في نفس التبويب في نفس اليوم (والسيرفر بيمنع التكرار برضه)
        try {
            const today = new Date().toDateString();
            const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
            const list: string[] = saved.day === today && Array.isArray(saved.paths) ? saved.paths : [];
            if (list.includes(pathname)) return;
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ day: today, paths: [...list, pathname] }));
        } catch {}

        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: pathname }),
            keepalive: true,
        }).catch(() => {});
    }, [pathname]);

    return null;
}