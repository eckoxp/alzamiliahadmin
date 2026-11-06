'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false });

interface ContentPage {
    id: number;
    slug: string;
    titleAr: string;
    titleEn: string;
    contentAr: string;
    contentEn: string;
}

const DEFAULT_PAGES = [
    { slug: 'privacy', titleAr: 'سياسة الخصوصية', titleEn: 'Privacy Policy' },
    { slug: 'terms', titleAr: 'شروط الاستخدام', titleEn: 'Terms of Use' },
];

export default function ContentManagementPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [pages, setPages] = useState<ContentPage[]>([]);
    const [selectedSlug, setSelectedSlug] = useState('privacy');
    const [form, setForm] = useState({ titleAr: '', titleEn: '', contentAr: '', contentEn: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/content')
            .then(r => r.json())
            .then(d => {
                setPages(d.pages || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        const page = pages.find(p => p.slug === selectedSlug);
        if (page) {
            setForm({
                titleAr: page.titleAr,
                titleEn: page.titleEn,
                contentAr: page.contentAr,
                contentEn: page.contentEn,
            });
        } else {
            const def = DEFAULT_PAGES.find(p => p.slug === selectedSlug);
            setForm({
                titleAr: def?.titleAr || '',
                titleEn: def?.titleEn || '',
                contentAr: '',
                contentEn: '',
            });
        }
    }, [selectedSlug, pages]);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await fetch('/api/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug: selectedSlug, ...form }),
            });
            // Refresh
            const r = await fetch('/api/content');
            const d = await r.json();
            setPages(d.pages || []);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { /* ignore */ }
        setSaving(false);
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading...</div>;
    }

    return (
        <div>
            <h1 className="admin-page-title">{isRTL ? 'سياسات وخصوصية' : 'Policies & Privacy'}</h1>

            {/* Page Selector */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {DEFAULT_PAGES.map(p => (
                    <button
                        key={p.slug}
                        onClick={() => setSelectedSlug(p.slug)}
                        className="admin-btn"
                        style={{
                            background: selectedSlug === p.slug ? '#000' : '#e5e7eb',
                            color: selectedSlug === p.slug ? '#fff' : '#374151',
                        }}
                    >
                        {isRTL ? p.titleAr : p.titleEn}
                    </button>
                ))}
            </div>

            {/* Titles */}
            <div className="admin-section">
                <h3>{isRTL ? 'العنوان' : 'Title'}</h3>
                <div className="admin-form-grid">
                    <div className="admin-field">
                        <label>{isRTL ? 'العنوان بالعربي' : 'Arabic Title'}</label>
                        <input type="text" dir="rtl" value={form.titleAr} onChange={e => setForm(p => ({ ...p, titleAr: e.target.value }))} />
                    </div>
                    <div className="admin-field">
                        <label>{isRTL ? 'العنوان بالانجليزي' : 'English Title'}</label>
                        <input type="text" dir="ltr" value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))} />
                    </div>
                </div>
            </div>

            {/* Content AR */}
            <div className="admin-section">
                <h3>{isRTL ? 'المحتوى بالعربي' : 'Arabic Content'}</h3>
                <RichTextEditor
                    key={`ar-${selectedSlug}`}
                    content={form.contentAr}
                    onChange={val => setForm(p => ({ ...p, contentAr: val }))}
                    dir="rtl"
                />
            </div>

            {/* Content EN */}
            <div className="admin-section">
                <h3>{isRTL ? 'المحتوى بالانجليزي' : 'English Content'}</h3>
                <RichTextEditor
                    key={`en-${selectedSlug}`}
                    content={form.contentEn}
                    onChange={val => setForm(p => ({ ...p, contentEn: val }))}
                    dir="ltr"
                />
            </div>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                {saved && <span style={{ color: '#059669', fontSize: '14px', alignSelf: 'center' }}>✓ {isRTL ? 'تم الحفظ' : 'Saved!'}</span>}
                <button onClick={handleSave} className="admin-btn admin-btn-primary" disabled={saving} style={{ padding: '10px 32px' }}>
                    {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ' : 'Save')}
                </button>
            </div>
        </div>
    );
}
