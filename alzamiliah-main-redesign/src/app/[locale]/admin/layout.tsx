'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { LayoutDashboard, Building2, SquarePlus, House, Inbox, QrCode, ChartNoAxesColumn, FileText, PanelRight, Languages, ExternalLink, LogOut } from 'lucide-react';
import './workspace.css';

const groups = [
    {
        ar: 'العقارات', en: 'Properties',
        items: [
            { path: '/projects', icon: Building2, ar: 'إدارة المشاريع', en: 'Manage Projects' },
            { path: '/projects/new', icon: SquarePlus, ar: 'إضافة مشروع جديد', en: 'Add New Project' },
            { path: '/apartments', icon: House, ar: 'إدارة الشقق والمباني', en: 'Apartments & Buildings' },
        ],
    },
    {
        ar: 'التواصل', en: 'Communication',
        items: [
            { path: '/contacts', icon: Inbox, ar: 'طلبات التواصل', en: 'Contact Requests' },
            { path: '/qrcode-leads', icon: QrCode, ar: 'طلبات QR Code', en: 'QR Code Leads' },
        ],
    },
    {
        ar: 'الموقع والإعدادات', en: 'Site & Settings',
        items: [
            { path: '/statistics', icon: ChartNoAxesColumn, ar: 'إحصائيات الموقع', en: 'Site Statistics' },
            { path: '/content', icon: FileText, ar: 'سياسات وخصوصية', en: 'Policies & Privacy' },
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
    const dashboard = { path: '', icon: LayoutDashboard, ar: 'نظرة عامة', en: 'Overview' };
    const items = [dashboard, ...groups.flatMap(group => group.items)];
    const nextLocale = isRTL ? 'en' : 'ar';
    const alternatePath = `/${nextLocale}${pathname.slice(locale.length + 1)}`;
    const languageLink = (
        <a className="alz-control alz-language" href={alternatePath}
            hrefLang={nextLocale} lang={nextLocale}
            onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                router.push(alternatePath + window.location.search + window.location.hash);
            }}>
            <Languages aria-hidden="true" />{isRTL ? 'English' : 'العربية'}
        </a>
    );
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

    function renderLink(item: typeof dashboard, iconOnly = false) {
        const Icon = item.icon;
        const label = t(item.ar, item.en);
        return (
            <Link key={item.path} href={base + item.path}
                aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}
                aria-current={current.path === item.path ? 'page' : undefined}
                onClick={() => {
                    if (window.matchMedia('(max-width: 820px)').matches) changeMenu(true);
                }}>
                <Icon aria-hidden="true" />{!iconOnly && <span>{label}</span>}
            </Link>
        );
    }

    if (isLoginPage) return <div className="alz-admin-login" dir={isRTL ? 'rtl' : 'ltr'}>{languageLink}{children}</div>;
    if (!user) return <div className="alz-workspace-loading" role="status">{t('جارٍ تحميل لوحة التحكم…', 'Loading dashboard…')}</div>;

    return (
        <div className="admin-layout-v2 alz-workspace" dir={isRTL ? 'rtl' : 'ltr'}
            data-menu={closed === null ? 'auto' : closed ? 'closed' : 'open'}
            onKeyDown={event => {
                if (event.key === 'Escape' && closed === false) changeMenu(true);
            }}>
            <a className="alz-skip" href="#alz-admin-main">{t('انتقل إلى المحتوى', 'Skip to content')}</a>
            <nav className="alz-rail" aria-label={t('اختصارات الإدارة', 'Admin shortcuts')}>
                <span className="alz-rail-mark" aria-hidden="true"><Building2 /></span>
                {items.map(item => renderLink(item, true))}
            </nav>
            <div className="alz-frame">
                <aside ref={sidebar} className="alz-sidebar" id="alz-admin-sidebar">
                    <Link href={base} className="alz-brand">
                        <Image src="/images/logo.png" width={120} height={55} alt={t('الزاملية', 'Alzamiliah')} priority />
                        <span>{t('لوحة الإدارة', 'Administration')}</span>
                    </Link>
                    <nav aria-label={t('أقسام الإدارة', 'Administration sections')}>
                        {renderLink(dashboard)}
                        {groups.map(group => (
                            <details key={group.en} open>
                                <summary>{t(group.ar, group.en)} <span aria-hidden="true">⌄</span></summary>
                                <div className="alz-nav-group">{group.items.map(item => renderLink(item))}</div>
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
                                <PanelRight aria-hidden="true" />
                            </button>
                            <span className="alz-crumb">{t(current.ar, current.en)}</span>
                        </div>
                        <div className="alz-bar-actions">
                            {languageLink}
                            <Link className="alz-control alz-icon-control" href={`/${locale}`} target="_blank" rel="noopener"
                                aria-label={t('عرض الموقع', 'View website')} title={t('عرض الموقع', 'View website')}><ExternalLink aria-hidden="true" /></Link>
                            <span className="alz-user"><span className="alz-avatar" aria-hidden="true">{user.name.trim().charAt(0)}</span>{user.name}</span>
                            <button className="alz-control alz-icon-control" type="button" onClick={handleLogout}
                                aria-label={t('تسجيل الخروج', 'Sign out')} title={t('تسجيل الخروج', 'Sign out')}><LogOut aria-hidden="true" /></button>
                        </div>
                    </header>
                    <main id="alz-admin-main" className="admin-main-v2" tabIndex={-1}>
                        <div className="admin-main-container">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}
