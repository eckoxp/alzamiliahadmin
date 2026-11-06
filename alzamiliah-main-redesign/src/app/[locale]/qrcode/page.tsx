'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
    Award, Home, Info, Building2, Mail, Check,
    Info as InfoIcon, CheckCircle2, Globe,
    ShieldCheck, Banknote, BadgeCheck,
} from 'lucide-react';

interface Project {
    id: number;
    nameAr: string;
    nameEn: string | null;
    image: string | null;
    locationAr: string | null;
    locationEn: string | null;
    status: number;
}

type ContactMethod = 'PHONE' | 'WHATSAPP' | 'EMAIL';

export default function QrCodePage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const otherLocale = isRTL ? 'en' : 'ar';

    const navItems = [
        { href: `/${locale}`,          labelAr: 'الرئيسية',    labelEn: 'Homepage',   icon: Home },
        { href: `/${locale}/about`,    labelAr: 'حول الشركة',  labelEn: 'About Us',   icon: Info },
        { href: `/${locale}/projects`, labelAr: 'مشاريعنا',    labelEn: 'Projects',   icon: Building2 },
        { href: `/${locale}/contact`,  labelAr: 'تواصل معنا',  labelEn: 'Contact Us', icon: Mail },
    ];

    const [projects, setProjects]           = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [selectedIds, setSelectedIds]     = useState<number[]>([]);
    const [form, setForm]                   = useState({ name: '', phone: '', email: '', contactMethod: 'PHONE' as ContactMethod });
    const [errors, setErrors]               = useState<Record<string, string>>({});
    const [sending, setSending]             = useState(false);
    const [success, setSuccess]             = useState(false);
    const [isLg, setIsLg]                   = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        setIsLg(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        fetch('/api/public/projects')
            .then(r => r.json())
            .then((data: Project[]) => setProjects(data.filter(p => p.status !== 0)))
            .catch(() => setProjects([]))
            .finally(() => setLoadingProjects(false));
    }, []);

    const toggleProject = (id: number) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

    const validate = () => {
        const e: Record<string, string> = {};

        if (!form.name.trim())
            e.name = isRTL ? 'يرجى إدخال الاسم الكريم' : 'Please enter your name';

        if (!form.phone.trim()) {
            e.phone = isRTL ? 'يرجى إدخال رقم الهاتف' : 'Please enter your phone number';
        } else {
            const c = form.phone.replace(/[\s\-+]/g, '');
            if (!(/^(05|5)\d{8}$/.test(c)) && !form.phone.startsWith('+9665') && c.length < 9)
                e.phone = isRTL ? 'يرجى إدخال رقم هاتف صحيح (مثال: 05xxxxxxxx)' : 'Enter a valid phone number';
        }

        if (!form.email.trim()) {
            e.email = isRTL ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            e.email = isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Enter a valid email address';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) {
            document.getElementById('qr-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        setSending(true);
        try {
            const res = await fetch('/api/qrcode-leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, projectIds: selectedIds }),
            });
            if (res.ok) {
                setSuccess(true);
                setForm({ name: '', phone: '', email: '', contactMethod: 'PHONE' });
                setSelectedIds([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const d = await res.json();
                setErrors({ api: d.error || (isRTL ? 'حدث خطأ' : 'An error occurred') });
            }
        } catch {
            setErrors({ api: isRTL ? 'خطأ في الشبكة' : 'Network error' });
        }
        setSending(false);
    };

    const getImageSrc = (image: string | null) => {
        if (!image) return '/images/logo.png';
        if (image.startsWith('http') || image.startsWith('/')) return image;
        return `/${image}`;
    };

    const SIDEBAR_W = 288;

    const sidebarStyle: React.CSSProperties = {
        position: 'fixed', top: 0, bottom: 0,
        width: `${SIDEBAR_W}px`, height: '100vh',
        background: '#5c3a21',
        display: isLg ? 'flex' : 'none',
        flexDirection: 'column',
        zIndex: 30,
        boxShadow: isRTL ? '-2px 0 24px rgba(0,0,0,0.25)' : '2px 0 24px rgba(0,0,0,0.25)',
        ...(isRTL ? { right: 0 } : { left: 0 }),
    };

    const contentStyle: React.CSSProperties = {
        position: 'relative', zIndex: 10,
        ...(isLg ? (isRTL ? { paddingRight: `${SIDEBAR_W}px` } : { paddingLeft: `${SIDEBAR_W}px` }) : {}),
    };

    const trustBadges = [
        { icon: BadgeCheck, titleAr: 'مطور معتمد',    titleEn: 'Licensed Developer',        subAr: 'مرخص من الهيئة العامة للعقار',        subEn: 'Licensed by REGA' },
        { icon: ShieldCheck, titleAr: 'ضمانات شاملة', titleEn: 'Comprehensive Guarantees',  subAr: 'تصل إلى 25 سنة على الهيكل والسباكة', subEn: 'Up to 25 years warranty' },
        { icon: Banknote,    titleAr: 'حلول تمويلية', titleEn: 'Financial Solutions',        subAr: 'شراكات مع كافة البنوك السعودية',      subEn: 'Partnerships with all banks' },
    ];

    /* ─── shared input style helper ─── */
    const inputStyle = (hasError: boolean, ltr = false): React.CSSProperties => ({
        width: '100%', padding: '11px 14px', fontSize: '14px', borderRadius: '8px',
        border: `1.5px solid ${hasError ? '#f87171' : '#e5e7eb'}`,
        background: hasError ? '#fef2f2' : '#fff',
        outline: 'none', boxSizing: 'border-box',
        textAlign: ltr ? 'left' : (isRTL ? 'right' : 'left'),
    });

    return (
        <div style={{ position: 'relative', minHeight: '100vh', direction: isRTL ? 'rtl' : 'ltr' }}>

            {/* ── Background ── */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <Image src="/images/bg_hero.png" alt="Al-Zamiliah" fill priority style={{ objectFit: 'cover' }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.3) 35%, rgba(92,58,33,0.95) 100%)',
                }} />
            </div>

            {/* ── Sidebar ── */}
            <aside style={sidebarStyle}>
                <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
                        <Image src="/images/logow.png" alt="Al-Zamiliah" width={120} height={120} style={{ objectFit: 'contain' }} />
                    </div>

                    {/* Nav */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        {navItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href}
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}
                                >
                                    <Icon size={17} style={{ color: '#c5a880', flexShrink: 0 }} />
                                    <span>{isRTL ? item.labelAr : item.labelEn}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Divider */}
                    <div style={{ borderTop: '1px solid rgba(197,168,128,0.2)', margin: '20px 0' }} />

                    {/* Language switcher */}
                    <Link href={`/${otherLocale}/qrcode`}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
                    >
                        <Globe size={16} style={{ color: '#c5a880' }} />
                        <span>{isRTL ? 'English' : 'عربي'}</span>
                    </Link>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div style={contentStyle}>
                <div style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 28px 64px' }}>

                    {/* Hero */}
                    <div style={{ textAlign: 'center', color: '#fff', marginBottom: '36px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: 'rgba(197,168,128,0.18)', border: '1px solid rgba(197,168,128,0.35)', color: '#c5a880', marginBottom: '18px' }}>
                            <Award size={13} />
                            <span>{isRTL ? 'الريادة في التطوير العقاري' : 'Pioneering Real Estate Development'}</span>
                        </div>
                        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.15 }}>
                            {isRTL ? 'امتلك مستقبلك اليوم' : 'Own Your Future Today'}
                        </h1>
                        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
                            {isRTL ? 'مشاريع سكنية وتجارية فاخرة تلبي تطلعاتك وتضمن استثمارك' : 'Luxury residential and commercial projects that secure your investment'}
                        </p>
                    </div>

                    {/* ── Success banner ── */}
                    {success && (
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '40px 28px', textAlign: 'center', boxShadow: '0 8px 32px rgba(92,58,33,0.18)', border: '1px solid rgba(197,168,128,0.3)' }}>
                            <div style={{ width: '68px', height: '68px', borderRadius: '50%', margin: '0 auto 20px', background: 'rgba(197,168,128,0.15)', border: '1px solid rgba(197,168,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={36} style={{ color: '#c5a880' }} />
                            </div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#5c3a21', margin: '0 0 12px' }}>
                                {isRTL ? 'تم تسجيل اهتمامك بنجاح!' : 'Interest Registered Successfully!'}
                            </h2>
                            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.8, margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                                {isRTL
                                    ? 'شكراً لثقتك بالزاملية للاستثمار. سيتواصل معك أحد مستشارينا خلال الـ 24 ساعة القادمة.'
                                    : 'Thank you for your trust in Al-Zamiliah Investment. One of our consultants will contact you within 24 hours.'}
                            </p>
                            <button
                                onClick={() => setSuccess(false)}
                                style={{ marginTop: '24px', padding: '11px 32px', borderRadius: '8px', background: '#5c3a21', color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer' }}
                            >
                                {isRTL ? 'تسجيل جديد' : 'New Registration'}
                            </button>
                        </div>
                    )}

                    {/* ── Form card ── */}
                    {!success && (
                        <div id="qr-form" style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

                            {/* Top bar */}
                            <div style={{ background: '#faf8f5', borderBottom: '1px solid #f0ece6', padding: '14px 24px', display: 'flex', justifyContent: 'center' }}>
                                <span style={{ background: '#5c3a21', color: '#fff', padding: '6px 24px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                                    {isRTL ? 'سجل اهتمامك' : 'Register Your Interest'}
                                </span>
                            </div>

                            <div style={{ padding: '28px 28px 32px' }}>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                    {/* Name */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textAlign: isRTL ? 'right' : 'left' }}>
                                            {isRTL ? 'الاسم الكامل' : 'Full Name'} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={isRTL ? 'أدخل اسمك الكريم' : 'Enter your full name'}
                                            value={form.name}
                                            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
                                            style={inputStyle(!!errors.name)}
                                        />
                                        {errors.name && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><InfoIcon size={11} />{errors.name}</p>}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textAlign: isRTL ? 'right' : 'left' }}>
                                            {isRTL ? 'رقم الهاتف' : 'Phone Number'} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="tel" dir="ltr" placeholder="05xxxxxxxx"
                                            value={form.phone}
                                            onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); if (errors.phone) setErrors(p => ({ ...p, phone: '' })); }}
                                            style={inputStyle(!!errors.phone, true)}
                                        />
                                        {errors.phone && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><InfoIcon size={11} />{errors.phone}</p>}
                                    </div>

                                    {/* Email — REQUIRED */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textAlign: isRTL ? 'right' : 'left' }}>
                                            {isRTL ? 'البريد الإلكتروني' : 'Email Address'} <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <input
                                            type="email" placeholder="name@example.com"
                                            value={form.email}
                                            onChange={e => { setForm(p => ({ ...p, email: e.target.value })); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                                            style={inputStyle(!!errors.email)}
                                        />
                                        {errors.email && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><InfoIcon size={11} />{errors.email}</p>}
                                    </div>

                                    {/* Projects — optional selection */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                                                {isRTL ? 'قائمة المشاريع المتاحة' : 'Available Projects'}
                                                <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af', marginRight: isRTL ? '6px' : 0, marginLeft: isRTL ? 0 : '6px' }}>
                                                    {isRTL ? '(اختياري)' : '(optional)'}
                                                </span>
                                            </h3>
                                            {selectedIds.length > 0 && (
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', background: 'rgba(197,168,128,0.15)', color: '#5c3a21' }}>
                                                    {selectedIds.length} {isRTL ? 'محدد' : 'selected'}
                                                </span>
                                            )}
                                        </div>

                                        {loadingProjects ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                                                        <div style={{ height: '120px', background: '#f3f4f6' }} />
                                                        <div style={{ padding: '10px 12px' }}>
                                                            <div style={{ height: '12px', background: '#f3f4f6', borderRadius: '4px', width: '65%' }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                {projects.map(project => {
                                                    const isSelected = selectedIds.includes(project.id);
                                                    const isSoon = project.status === 4;
                                                    return (
                                                        <div key={project.id}
                                                            onClick={() => !isSoon && toggleProject(project.id)}
                                                            style={{
                                                                borderRadius: '10px', overflow: 'hidden',
                                                                cursor: isSoon ? 'not-allowed' : 'pointer',
                                                                border: isSelected ? '2px solid #c5a880' : '1.5px solid #e5e7eb',
                                                                boxShadow: isSelected ? '0 0 0 3px rgba(197,168,128,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
                                                                transition: 'border-color 0.15s, box-shadow 0.15s',
                                                            }}
                                                        >
                                                            <div style={{ position: 'relative', width: '100%', height: '120px', background: '#f3f4f6', overflow: 'hidden' }}>
                                                                <Image
                                                                    src={getImageSrc(project.image)}
                                                                    alt={isRTL ? project.nameAr : project.nameEn || project.nameAr}
                                                                    fill sizes="(max-width:768px) 50vw,300px"
                                                                    style={{ objectFit: 'cover' }}
                                                                />
                                                                {isSoon && (
                                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '2px' }}>
                                                                        <span style={{ fontWeight: 800, fontSize: '20px' }}>قريباً</span>
                                                                        <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8 }}>SOON</span>
                                                                    </div>
                                                                )}
                                                                {isSelected && (
                                                                    <div style={{ position: 'absolute', top: '8px', right: isRTL ? 'auto' : '8px', left: isRTL ? '8px' : 'auto', width: '26px', height: '26px', borderRadius: '50%', background: '#c5a880', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                                                                        <Check size={14} strokeWidth={3} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div style={{ padding: '10px 12px', background: isSelected ? 'rgba(197,168,128,0.05)' : '#fff' }}>
                                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1f2937', textAlign: isRTL ? 'right' : 'left' }}>
                                                                    {isRTL ? project.nameAr : project.nameEn || project.nameAr}
                                                                </p>
                                                                {(isRTL ? project.locationAr : project.locationEn || project.locationAr) && (
                                                                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c5a880', flexShrink: 0, display: 'inline-block' }} />
                                                                        {isRTL ? project.locationAr : project.locationEn || project.locationAr}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact method */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px', textAlign: isRTL ? 'right' : 'left' }}>
                                            {isRTL ? 'طريقة التواصل المفضلة:' : 'Preferred Contact Method:'}
                                        </label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: isRTL ? 'flex-end' : 'flex-start' }}>
                                            {(['PHONE', 'WHATSAPP', 'EMAIL'] as ContactMethod[]).map(method => (
                                                <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                                                    <input
                                                        type="radio" name="contactMethod"
                                                        checked={form.contactMethod === method}
                                                        onChange={() => setForm(p => ({ ...p, contactMethod: method }))}
                                                        style={{ width: '15px', height: '15px', accentColor: '#5c3a21' }}
                                                    />
                                                    {method === 'PHONE' ? (isRTL ? 'رقم الهاتف' : 'Phone')
                                                        : method === 'WHATSAPP' ? (isRTL ? 'واتساب' : 'WhatsApp')
                                                            : (isRTL ? 'البريد الإلكتروني' : 'Email')}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {errors.api && (
                                        <div style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                            <InfoIcon size={14} /> {errors.api}
                                        </div>
                                    )}

                                    <button type="submit" disabled={sending}
                                        style={{ width: '100%', padding: '14px', borderRadius: '10px', background: sending ? '#9ca3af' : '#5c3a21', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', boxShadow: sending ? 'none' : '0 4px 16px rgba(92,58,33,0.3)', transition: 'background 0.2s' }}
                                    >
                                        {sending ? (isRTL ? 'جاري التسجيل...' : 'Submitting...') : (isRTL ? 'سجل اهتمامك' : 'Register Your Interest')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                
          
            </div>
        </div>
    );
}