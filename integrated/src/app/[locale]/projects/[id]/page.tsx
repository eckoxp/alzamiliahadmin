'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectGallery from '@/components/ProjectGallery';

interface GalleryImage { id: number; url: string; sortOrder: number; }
interface Apartment {
    id: number; nameAr: string; nameEn: string | null; buildingName: string | null;
    floor: number | null; area: number | null; bedrooms: number | null; bathrooms: number | null;
    price: number | null; status: string; image: string | null;
    livingRoom: number | null; kitchen: number | null; driverRoom: number | null;
    maidRoom: number | null; balcony: number | null; parking: number | null;
    entrance: number | null; majlis: number | null; storage: number | null;
    garden: number | null; cars: number | null;
}
interface Project {
    id: number; nameAr: string; nameEn: string | null; type: string | null;
    descriptionAr: string | null; descriptionEn: string | null;
    excerptAr: string | null; excerptEn: string | null;
    image: string | null; image2: string | null; image3: string | null;
    image4: string | null; image5: string | null; image6: string | null;
    buildingsCount: number | null; unitsCount: number | null; elevatorsCount: number | null;
    locationAr: string | null; locationEn: string | null; address: string | null;
    linkMap: string | null; livePreview: string | null; icon3d: string | null; city: string | null;
    lat: number | null; lng: number | null; status: number; availability: number;
    highQuality: number; smartEntry: number; fireSensor: number;
    elevator: number; air: number; elec: number; plumber: number;
    devices: number; house: number; sqFit: string | null; buildYear: string | null;
    projectFile: string | null; projectFile2: string | null; projectFile3: string | null;
    video: string | null;
    apartments: Apartment[]; galleryImages: GalleryImage[];
}

const statusMap: Record<number, { ar: string; en: string }> = {
    0: { ar: 'مُباع', en: 'Sold' },
    1: { ar: 'تحت الإنشاء', en: 'Under Construction' },
    3: { ar: 'متاح للبيع', en: 'Available for Sale' },
    4: { ar: 'قريباً', en: 'Coming Soon' },
};

const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>;

function AptFeatures({ apt, isRTL }: { apt: Apartment; isRTL: boolean }) {
    const items = [
        { v: apt.kitchen, ar: 'المطبخ', en: 'Kitchen' },
        { v: apt.parking, ar: 'موقف سيارات', en: 'Parking' },
        { v: apt.balcony, ar: 'شرفة', en: 'Balcony' },
        { v: apt.bathrooms, ar: 'الحمامات', en: 'Bathrooms' },
        { v: apt.bedrooms, ar: 'غرفة نوم', en: 'Bedroom' },
        { v: apt.majlis, ar: 'صالة عائلية', en: 'Hall' },
        { v: apt.maidRoom, ar: 'غرفة خادمة', en: 'House Manager' },
        { v: apt.entrance, ar: 'مدخلين', en: 'Two Entrances' },
        { v: apt.livingRoom, ar: 'مجلس', en: 'Living Room' },
        { v: apt.storage, ar: 'مخزن', en: 'Storage' },
        { v: apt.garden, ar: 'حديقة', en: 'Garden' },
        { v: apt.driverRoom, ar: 'غرفة سائق', en: 'Driver Room' },
    ].filter(i => i.v && i.v > 0);
    if (!items.length) return null;
    return (
        <div>
            <div className="pdp-unit-features-title">{isRTL ? 'مزايا الوحدة' : 'Features'}</div>
            <div className="pdp-unit-features-grid">
                {items.map((it, i) => (
                    <div key={i} className="pdp-unit-feat"><CheckIcon /> {isRTL ? it.ar : it.en} : {it.v}</div>
                ))}
            </div>
        </div>
    );
}

function AptContactForm({ apt, isRTL }: { apt: Apartment; isRTL: boolean }) {
    const aptName = isRTL ? apt.nameAr : (apt.nameEn || apt.nameAr);
    const waMsg = encodeURIComponent(isRTL ? `استفسار عن ${aptName}` : `Inquiry about ${aptName}`);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) return;
        setSending(true);
        try {
            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, message: `[${aptName}] ${formData.message}` }),
            });
            setSent(true);
            setTimeout(() => { setSent(false); setFormData({ name: '', email: '', phone: '', message: '' }); }, 3000);
        } catch { /* ignore */ }
        setSending(false);
    };

    return (
        <div className="pdp-unit-contact">
            <h5>{isRTL ? 'أرسل استفسارك' : 'Send your Inquiry'}</h5>
            {sent ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#28a745', fontWeight: 600 }}>
                    ✅ {isRTL ? 'تم الإرسال بنجاح!' : 'Sent successfully!'}
                </div>
            ) : (
                <>
                    <div className="pdp-unit-contact-fields">
                        <input placeholder={isRTL ? 'الاسم *' : 'Name *'} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                        <input placeholder={isRTL ? 'البريد *' : 'Email *'} value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} type="email" />
                        <input placeholder={isRTL ? 'الهاتف' : 'Phone'} value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} type="tel" />
                    </div>
                    <textarea placeholder={isRTL ? 'رسالتك...' : 'Your message...'} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} />
                    <div className="pdp-unit-contact-btns">
                        <a href="tel:+966920031404" className="pdp-unit-contact-btn">📞 {isRTL ? 'اتصل بنا' : 'Contact Phone'}</a>
                        <a href={`https://wa.me/966920031404?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="pdp-unit-contact-btn">💬 WhatsApp</a>
                    </div>
                    <button className="pdp-unit-contact-send" onClick={handleSubmit} disabled={sending}>{sending ? '...' : (isRTL ? 'إرسال' : 'Send')}</button>
                </>
            )}
        </div>
    );
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openBuilding, setOpenBuilding] = useState<string | null>(null);
    const [expandedApt, setExpandedApt] = useState<number | null>(null);
    const [show3D, setShow3D] = useState(false);

    useEffect(() => {
        params.then(({ id }) => {
            fetch(`/api/public/projects/${id}`)
                .then(r => { if (!r.ok) throw new Error(); return r.json(); })
                .then(d => { setProject(d.project || null); if (!d.project) setError('Not found'); setLoading(false); })
                .catch(() => { setError(isRTL ? 'حدث خطأ' : 'Error'); setLoading(false); });
        });
    }, [params, isRTL]);

    if (loading) return (
        <><Header forceWhite /><main className="pdp" style={{ paddingTop: '77px' }}><div style={{ textAlign: 'center', padding: '100px 20px' }}><div className="loading-spinner" /><p style={{ color: '#666', marginTop: 20 }}>{isRTL ? 'جاري التحميل...' : 'Loading...'}</p></div></main><Footer /></>
    );
    if (error || !project) return (
        <><Header forceWhite /><main className="pdp" style={{ paddingTop: '77px' }}><div style={{ textAlign: 'center', padding: '100px 20px' }}><h3 style={{ color: '#dc3545', marginBottom: 20 }}>{error}</h3><Link href={`/${locale}/projects`} style={{ background: 'var(--color-primary)', color: '#fff', padding: '10px 25px', borderRadius: 8, fontWeight: 600 }}>{isRTL ? 'العودة للمشاريع' : 'Back to Projects'}</Link></div></main><Footer /></>
    );

    const name = isRTL ? project.nameAr : (project.nameEn || project.nameAr);
    const desc = isRTL ? project.descriptionAr : (project.descriptionEn || project.descriptionAr);
    const loc = isRTL ? project.locationAr : (project.locationEn || project.locationAr);
    const st = statusMap[project.status] || statusMap[3];

    const features = [
        { on: project.highQuality, ar: 'تشطيب فاخر', en: 'High Quality Finish', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
        { on: project.smartEntry, ar: 'دخول ذكي', en: 'Smart Entry', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M12 14v3"/></svg> },
        { on: project.fireSensor, ar: 'حساسات حريق', en: 'Fire Sensors', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M12 22c-4.97 0-9-2.69-9-6 0-3.5 3-6 5-8 0 4 2 6 4 7 1-3 2-6 1-9 3 2 6 6 6 11 0 3.31-3.13 5-7 5z"/></svg> },
        { on: project.elevator, ar: 'مصعد', en: 'Elevator', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="3" y="2" width="18" height="20" rx="2"/><path d="M9 8l3-3 3 3M9 16l3 3 3-3"/></svg> },
        { on: project.air, ar: 'تكييف مركزي', en: 'Central AC', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M12 2v8M4.93 10.93l2.83 2.83M2 18h8M19.07 10.93l-2.83 2.83M22 18h-8M12 22v-8"/></svg> },
    ].filter(f => f.on && f.on > 0);

    const yearLabel = (n: number) => isRTL ? (n === 1 ? 'سنة' : n === 2 ? 'سنتان' : n <= 10 ? `${n} سنوات` : `${n} سنة`) : (n === 1 ? '1 year' : `${n} years`);

    const guarantees = [
        { on: project.elec, ar: 'ضمان كهرباء', en: 'Electrical Warranty', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
        { on: project.plumber, ar: 'ضمان سباكة', en: 'Plumbing Warranty', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
        { on: project.devices, ar: 'ضمان أجهزة', en: 'Devices Warranty', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg> },
        { on: project.house, ar: 'ضمان إنشاءات', en: 'Construction Warranty', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    ].filter(g => g.on && g.on > 0);

    const buildings: Record<string, Apartment[]> = {};
    project.apartments?.forEach(a => {
        const b = a.buildingName || 'General';
        if (!buildings[b]) buildings[b] = [];
        buildings[b].push(a);
    });

    // Check both livePreview and icon3d fields for 3D viewer URL
    const livePreviewLinks = project.livePreview?.split(',').filter((l: string) => l.trim()) || [];
    const icon3dLinks = project.icon3d?.split(',').filter((l: string) => l.trim()) || [];
    const liveLinks = livePreviewLinks.length > 0 ? livePreviewLinks : icon3dLinks;
    const has3D = liveLinks.length > 0;

    return (
        <>
            <Header forceWhite />
            <main className="pdp" style={{ paddingTop: '77px' }}>
                {/* Breadcrumb */}
                <div className="pdp-breadcrumb">
                    <div className="container">
                        <Link href={`/${locale}`}>{isRTL ? 'الرئيسية' : 'Home'}</Link>
                        <span className="pdp-sep">›</span>
                        <Link href={`/${locale}/projects`}>{isRTL ? 'المشاريع' : 'Projects'}</Link>
                        <span className="pdp-sep">›</span>
                        <span className="pdp-current">{name}</span>
                    </div>
                </div>

                <div className="container" style={{ padding: '30px 15px 60px' }}>
                    <h1 className="pdp-title">{name}</h1>

                    {/* Gallery */}
                    <ProjectGallery
                        mainImage={project.image}
                        legacyImages={[project.image2, project.image3, project.image4, project.image5, project.image6]}
                        galleryImages={project.galleryImages || []}
                        projectName={project.nameEn || project.nameAr}
                        projectNameAr={project.nameAr}
                    />

                    {/* 3D & Construction Icons */}
                    {has3D && (
                        <div className="pdp-3d-row">
                            <button className={`pdp-3d-icon-btn ${show3D ? 'active' : ''}`} onClick={() => setShow3D(!show3D)}>
                                <span className="pdp-3d-icon-circle">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                                </span>
                                <span>3D</span>
                            </button>
                            <a href={`/${locale}`} className="pdp-3d-icon-btn" style={{ textDecoration: 'none' }}>
                                <span className="pdp-3d-icon-circle">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M15 13h2M15 17h2"/></svg>
                                </span>
                                <span>{isRTL ? 'متابعة مراحل البناء' : 'Follow-up of construction stages'}</span>
                            </a>
                        </div>
                    )}

                    {/* 3D Preview Iframe */}
                    {show3D && has3D && (
                        <div className="pdp-3d-preview">
                            <div className="pdp-3d-preview-title">{isRTL ? 'معاينة المشروع' : 'Project Preview'}</div>
                            <iframe src={liveLinks[0].trim()} allowFullScreen allow="accelerometer; autoplay; camera; gyroscope; fullscreen" style={{ width: '100%', height: 800, border: 'none' }} />
                        </div>
                    )}

                    {/* Two-Column Layout */}
                    <div className="pdp-layout">
                        {/* Main Column */}
                        <div>
                            {/* Description */}
                            {desc && (
                                <div className="pdp-card">
                                    <div className="pdp-card-label">{isRTL ? 'الوصف' : 'Description'}</div>
                                    <div style={{ fontSize: 15, lineHeight: 1.8, color: '#555' }} dangerouslySetInnerHTML={{ __html: desc }} />
                                </div>
                            )}

                            {/* Overview */}
                            <div className="pdp-card">
                                <div className="pdp-card-label">{isRTL ? 'نظرة عامة' : 'Overview'}</div>
                                <div className="pdp-stats">
                                    {project.buildingsCount != null && project.buildingsCount > 0 && (
                                        <div className="pdp-stat">
                                            <div className="pdp-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg></div>
                                            <div className="pdp-stat-val">{project.buildingsCount}</div>
                                            <div className="pdp-stat-lbl">{isRTL ? 'المباني' : 'Buildings'}</div>
                                        </div>
                                    )}
                                    {project.unitsCount != null && project.unitsCount > 0 && (
                                        <div className="pdp-stat">
                                            <div className="pdp-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                                            <div className="pdp-stat-val">{project.unitsCount}</div>
                                            <div className="pdp-stat-lbl">{isRTL ? 'الوحدات' : 'Units'}</div>
                                        </div>
                                    )}
                                    <div className="pdp-stat">
                                        <div className="pdp-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                                        <div className="pdp-stat-val">{isRTL ? st.ar : st.en}</div>
                                        <div className="pdp-stat-lbl">{isRTL ? 'الحالة' : 'available'}</div>
                                    </div>
                                    {project.sqFit && (
                                        <div className="pdp-stat">
                                            <div className="pdp-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg></div>
                                            <div className="pdp-stat-val">{project.sqFit}</div>
                                            <div className="pdp-stat-lbl">{isRTL ? 'المساحة م²' : 'Space m²'}</div>
                                        </div>
                                    )}
                                    {project.buildYear && (
                                        <div className="pdp-stat">
                                            <div className="pdp-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                                            <div className="pdp-stat-val">{project.buildYear}</div>
                                            <div className="pdp-stat-lbl">{isRTL ? 'سنة البناء' : 'Build Year'}</div>
                                        </div>
                                    )}
                                </div>
                            </div>



                            {/* Property Units */}
                            {Object.keys(buildings).length > 0 && (
                                <div className="pdp-card">
                                    <div className="pdp-card-label">{isRTL ? 'الوحدات السكنية' : 'Property Units'}</div>
                                    {Object.entries(buildings).map(([bName, apts]) => (
                                        <div key={bName} style={{ marginBottom: 12 }}>
                                            <button className="pdp-building-btn" onClick={() => setOpenBuilding(openBuilding === bName ? null : bName)}>
                                                <span>{bName}</span>
                                                <span>{openBuilding === bName ? '▲' : '▼'}</span>
                                            </button>
                                            {openBuilding === bName && (
                                                <div style={{ padding: '10px 0' }}>
                                                    {apts.map(apt => {
                                                        const aptName = isRTL ? apt.nameAr : (apt.nameEn || apt.nameAr);
                                                        const isExpanded = expandedApt === apt.id;
                                                        return (
                                                            <div key={apt.id}>
                                                                <div className={`pdp-unit-row ${apt.status !== 'available' ? 'pdp-unit-row-disabled' : ''}`} onClick={() => { if (apt.status === 'available') setExpandedApt(isExpanded ? null : apt.id); }}>
                                                                    <span className="pdp-unit-name">{aptName}</span>
                                                                    {apt.price != null && <span style={{ fontWeight: 600, color: '#b8860b' }}>{apt.price.toLocaleString()} <small>SAR</small></span>}
                                                                    {apt.area && <span>{apt.area} m²</span>}
                                                                    {apt.bedrooms != null && <span>{apt.bedrooms} {isRTL ? 'غرف' : 'BR'}</span>}
                                                                    <span className={`pdp-unit-badge ${apt.status}`}>
                                                                        {apt.status === 'available' ? (isRTL ? 'متاح' : 'Available')
                                                                            : apt.status === 'reserved' ? (isRTL ? 'محجوز' : 'Reserved')
                                                                            : (isRTL ? 'مُباع' : 'Sold')}
                                                                    </span>
                                                                    {apt.status === 'available' && <a href="https://wa.me/966920031404" target="_blank" rel="noopener noreferrer" className="pdp-unit-wa" onClick={e => e.stopPropagation()}>WhatsApp</a>}
                                                                </div>
                                                                {isExpanded && apt.status === 'available' && (
                                                                    <div className="pdp-unit-expand">
                                                                        {/* Price + Area + Status header */}
                                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 16, fontSize: 14 }}>
                                                                            {apt.price != null && <span><strong>{isRTL ? 'السعر:' : 'Price:'}</strong> {apt.price.toLocaleString()} SAR</span>}
                                                                            {apt.area != null && <span><strong>{isRTL ? 'المساحة:' : 'Area:'}</strong> {apt.area} m²</span>}
                                                                            <span><strong>{isRTL ? 'الحالة:' : 'Status:'}</strong> {isRTL ? 'متاح' : 'Available'}</span>
                                                                        </div>
                                                                        <div className="pdp-unit-expand-grid">
                                                                            {/* Image */}
                                                                            <div>
                                                                                {apt.image ? (
                                                                                    <a href={apt.image.startsWith('http') ? apt.image : (apt.image.startsWith('/') ? apt.image : `/${apt.image}`)} target="_blank" rel="noopener noreferrer">
                                                                                        <img src={apt.image.startsWith('http') ? apt.image : (apt.image.startsWith('/') ? apt.image : `/${apt.image}`)} alt={aptName} className="pdp-unit-image" />
                                                                                    </a>
                                                                                ) : (
                                                                                    <div style={{ height: 200, background: '#f5f5f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                                                                                        {isRTL ? 'لا توجد صورة' : 'No image'}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {/* Features */}
                                                                            <div>
                                                                                <AptFeatures apt={apt} isRTL={isRTL} />
                                                                            </div>
                                                                        </div>
                                                                        <AptContactForm apt={apt} isRTL={isRTL} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Map */}
                            {project.lat && project.lng && (
                                <div className="pdp-card">
                                    <div className="pdp-card-label">{isRTL ? 'الخريطة' : 'Map'}</div>
                                    <div style={{ borderRadius: 12, overflow: 'hidden', height: 300 }}>
                                        <iframe src={`https://maps.google.com/maps?q=${project.lat},${project.lng}&z=15&output=embed`} allowFullScreen loading="lazy" style={{ width: '100%', height: '100%', border: 'none' }} />
                                    </div>
                                </div>
                            )}

                            {/* Project Files & Video */}
                            {(project.projectFile || project.projectFile2 || project.projectFile3 || project.video) && (
                                <div className="pdp-card">
                                    <div className="pdp-card-label">{isRTL ? 'ملفات المشروع' : 'Project Files'}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: project.video ? 16 : 0 }}>
                                        {project.projectFile && <a href={project.projectFile.startsWith('/') ? project.projectFile : `/${project.projectFile}`} target="_blank" rel="noopener noreferrer" className="pdp-action-btn">{isRTL ? 'ملف المشروع' : 'Project File'}</a>}
                                        {project.projectFile2 && <a href={project.projectFile2.startsWith('/') ? project.projectFile2 : `/${project.projectFile2}`} target="_blank" rel="noopener noreferrer" className="pdp-action-btn">{isRTL ? 'ملف إضافي' : 'Additional File'}</a>}
                                        {project.projectFile3 && <a href={project.projectFile3.startsWith('/') ? project.projectFile3 : `/${project.projectFile3}`} target="_blank" rel="noopener noreferrer" className="pdp-action-btn">{isRTL ? 'ملف إضافي 2' : 'Additional File 2'}</a>}
                                    </div>
                                    {project.video && (
                                        <div style={{ borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
                                            <video controls style={{ width: '100%', maxHeight: 400 }} preload="metadata">
                                                <source src={project.video.startsWith('/') ? project.video : `/${project.video}`} />
                                            </video>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="pdp-sidebar">
                            {/* Location */}
                            <div className="pdp-card pdp-location-card">
                                <div className="pdp-card-label">{isRTL ? 'الموقع' : 'Location'}</div>
                                {project.city && <p><strong>{isRTL ? 'المدينة:' : 'City:'}</strong> {project.city}</p>}
                                {loc && <p><strong>{isRTL ? 'العنوان:' : 'Address:'}</strong> {loc}</p>}
                                {project.type && <p><strong>{isRTL ? 'نوع العقار:' : 'Type:'}</strong> {project.type}</p>}
                                {project.linkMap && <a href={project.linkMap} target="_blank" rel="noopener noreferrer" className="pdp-action-btn" style={{ marginTop: 10, display: 'inline-block' }}>{isRTL ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}</a>}
                            </div>

                            {/* Features */}
                            {features.length > 0 && (
                                <div className="pdp-card">
                                    <div className="pdp-card-label">{isRTL ? 'مميزات المشروع' : 'Project Features'}</div>
                                    <div className="pdp-features">
                                        {features.map((f, i) => (
                                            <div key={i} className="pdp-feature"><span className="pdp-feature-icon">{f.svg}</span><span>{isRTL ? f.ar : f.en}{f.on > 1 ? ` - ${yearLabel(f.on)}` : ''}</span></div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Guarantees */}
                            {guarantees.length > 0 && (
                                <div className="pdp-card">
                                    <div className="pdp-card-label">{isRTL ? 'الضمانات' : 'Guarantees'}</div>
                                    <div className="pdp-features">
                                        {guarantees.map((g, i) => (
                                            <div key={i} className="pdp-feature"><span className="pdp-feature-icon">{g.svg}</span><span>{isRTL ? g.ar : g.en} - {yearLabel(g.on)}</span></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
