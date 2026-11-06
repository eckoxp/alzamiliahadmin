'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import './workspace.css';

const groups = [
    {
        ar: 'العقارات', en: 'Properties',
        items: [
            { path: '/projects', ar: 'إدارة المشاريع', en: 'Manage Projects' },
            { path: '/projects/new', ar: 'إضافة مشروع جديد', en: 'Add New Project' },
            { path: '/apartments', ar: 'إدارة الشقق والمباني', en: 'Apartments & Buildings' },
        ],
    },
    {
        ar: 'التواصل', en: 'Communication',
        items: [
            { path: '/contacts', ar: 'طلبات التواصل', en: 'Contact Requests' },
            { path: '/qrcode-leads', ar: 'طلبات QR Code', en: 'QR Code Leads' },
        ],
    },
    {
        ar: 'الموقع والإعدادات', en: 'Site & Settings',
        items: [
            { path: '/statistics', ar: 'إحصائيات الموقع', en: 'Site Statistics' },
            { path: '/promotion', ar: 'ترويج للموقع', en: 'Site Promotion' },
            { path: '/content', ar: 'سياسات وخصوصية', en: 'Policies & Privacy' },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const base = `/${locale}/admin`;
    const isLoginPage = pathname === `${base}/login`;
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [closed, setClosed] = useState<boolean | null>(null);
    const toggle = useRef<HTMLButtonElement>(null);
    const sidebar = useRef<HTMLElement>(null);
    const isRTL = locale === 'ar';
    const t = (ar: string, en: string) => isRTL ? ar : en;
    const dashboard = { path: '', ar: 'نظرة عامة', en: 'Overview' };
    const items = [dashboard, ...groups.flatMap(group => group.items)];
    const current = items.filter(({ path }) => pathname === base + path ||
        (path && pathname.startsWith(`${base}${path}/`)))
        .sort((a, b) => b.path.length - a.path.length)[0] ?? dashboard;

    useEffect(() => {
        if (isLoginPage) return;
        const abort = new AbortController();
        fetch('/api/auth/me', { signal: abort.signal })
            .then(res => {
                if (!res.ok) throw new Error('Not authenticated');
                return res.json();
            })
            .then(data => setUser(data.user))
            .catch(() => {
                if (!abort.signal.aborted) router.replace(`${base}/login`);
            });
        return () => abort.abort();
    }, [isLoginPage, base, router]);

    async function handleLogout() {
        const response = await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
        if (!response?.ok) {
            window.alert(t('تعذّر تسجيل الخروج. حاول مرة أخرى.', 'Could not sign out. Try again.'));
            return;
        }
        setUser(null);
        router.replace(`${base}/login`);
    }

    function changeMenu(nextClosed: boolean) {
        setClosed(nextClosed);
        if (nextClosed) toggle.current?.focus();
        else requestAnimationFrame(() => sidebar.current?.querySelector<HTMLElement>('a')?.focus());
    }

    function renderLink(item: typeof dashboard) {
        return (
            <Link key={item.path} href={base + item.path}
                aria-current={current.path === item.path ? 'page' : undefined}
                onClick={() => {
                    if (window.matchMedia('(max-width: 820px)').matches) changeMenu(true);
                }}>
                {t(item.ar, item.en)}
            </Link>
        );
    }

    if (isLoginPage) return <>{children}</>;
    if (!user) return <div className="alz-workspace-loading" role="status">{t('جارٍ تحميل لوحة التحكم…', 'Loading dashboard…')}</div>;

    return (
        <div className="admin-layout-v2 alz-workspace" dir={isRTL ? 'rtl' : 'ltr'}
            data-menu={closed === null ? 'auto' : closed ? 'closed' : 'open'}
            onKeyDown={event => {
                if (event.key === 'Escape' && closed === false) changeMenu(true);
            }}>
            <a className="alz-skip" href="#alz-admin-main">{t('انتقل إلى المحتوى', 'Skip to content')}</a>
            <aside ref={sidebar} className="alz-sidebar" id="alz-admin-sidebar">
                <Link href={base} className="alz-brand">
                    <Image src="/admin-brand/logo-white.png" width={135} height={56} alt={t('الزاملية', 'Alzamiliah')} priority />
                    <span>{t('لوحة الإدارة', 'Administration')}</span>
                </Link>
                <nav aria-label={t('أقسام الإدارة', 'Administration sections')}>
                    {renderLink(dashboard)}
                    {groups.map(group => (
                        <details key={group.en} open>
                            <summary>{t(group.ar, group.en)} <span aria-hidden="true">⌄</span></summary>
                            <div className="alz-nav-group">{group.items.map(renderLink)}</div>
                        </details>
                    ))}
                </nav>
                <div className="alz-sidebar-footer">{t('الزاملية للتطوير والاستثمار العقاري', 'Alzamiliah Real Estate')}</div>
            </aside>
            <button className="alz-scrim" type="button" aria-label={t('إغلاق القائمة', 'Close menu')} onClick={() => changeMenu(true)} />
            <div className="alz-body">
                <header className="alz-bar">
                    <div className="alz-bar-start">
                        <button ref={toggle} className="alz-control" type="button" aria-controls="alz-admin-sidebar"
                            aria-expanded={closed === null ? undefined : !closed}
                            aria-label={t('تبديل القائمة الجانبية', 'Toggle sidebar')}
                            onClick={() => changeMenu(closed === null
                                ? !window.matchMedia('(max-width: 820px)').matches : !closed)}>
                            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" />
                            </svg>
                        </button>
                        <span className="alz-crumb">{t(current.ar, current.en)}</span>
                    </div>
                    <div className="alz-bar-actions">
                        <span className="alz-user">{user.name}</span>
                        <Link className="alz-control" href={`/${locale}`} target="_blank" rel="noopener">{t('عرض الموقع', 'View Website')}</Link>
                        <button className="alz-control" type="button" onClick={handleLogout}>{t('خروج', 'Sign out')}</button>
                    </div>
                </header>
                <main id="alz-admin-main" className="admin-main-v2" tabIndex={-1}>
                    <div className="admin-main-container">{children}</div>
                </main>
            </div>
        </div>
    );
}
