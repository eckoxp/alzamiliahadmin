'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';

interface GalleryImage {
    id: number;
    url: string;
    sortOrder: number;
}

interface Props {
    mainImage: string | null;
    legacyImages: (string | null)[];
    galleryImages: GalleryImage[];
    projectName: string;
    projectNameAr: string;
}

export default function ProjectGallery({ mainImage, legacyImages, galleryImages, projectName, projectNameAr }: Props) {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const allImages: string[] = [];
    if (mainImage) allImages.push(mainImage);
    legacyImages.forEach(img => { if (img && !allImages.includes(img)) allImages.push(img); });
    galleryImages.forEach(gi => { if (gi.url && !allImages.includes(gi.url)) allImages.push(gi.url); });

    const [activeIdx, setActiveIdx] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const closeLightbox = useCallback(() => setLightboxOpen(false), []);
    const prevImage = useCallback(() => setActiveIdx(i => (i - 1 + allImages.length) % allImages.length), [allImages.length]);
    const nextImage = useCallback(() => setActiveIdx(i => (i + 1) % allImages.length), [allImages.length]);

    useEffect(() => {
        if (!lightboxOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') isRTL ? nextImage() : prevImage();
            if (e.key === 'ArrowRight') isRTL ? prevImage() : nextImage();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxOpen, isRTL, closeLightbox, prevImage, nextImage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, message: `[${projectName}] ${formData.message}` }),
            });
            setSent(true);
            setTimeout(() => { setSent(false); setFormData({ name: '', email: '', phone: '', message: '' }); }, 3000);
        } catch { /* ignore */ }
        setSending(false);
    };

    if (allImages.length === 0) return null;

    return (
        <>
            {/* Gallery Card */}
            <div className="gallery-card">
                <img
                    src={allImages[activeIdx] || '/images/logo.png'}
                    alt={projectName}
                    className="gallery-main-img"
                    onClick={() => { setLightboxOpen(true); }}
                />
                {allImages.length > 1 && (
                    <div className="gallery-thumbs-row">
                        {allImages.map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                alt={`${i + 1}`}
                                className={`gallery-thumb-img ${activeIdx === i ? 'active' : ''}`}
                                onClick={() => setActiveIdx(i)}
                                loading="lazy"
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div className="lb-overlay" onClick={closeLightbox}>
                    <div className="lb-box" onClick={e => e.stopPropagation()}>
                        <div className="lb-img-side">
                            <button className="lb-close" onClick={closeLightbox}>×</button>
                            {allImages.length > 1 && <button className="lb-arrow lb-prev" onClick={prevImage}>‹</button>}
                            <img src={allImages[activeIdx]} alt={projectName} className="lb-main-img" />
                            {allImages.length > 1 && <button className="lb-arrow lb-next" onClick={nextImage}>›</button>}
                            {allImages.length > 1 && <div className="lb-counter">{activeIdx + 1} / {allImages.length}</div>}
                        </div>
                        <div className="lb-form-side">
                            <h3>{isRTL ? projectNameAr : projectName}</h3>
                            <p className="lb-form-sub">{isRTL ? 'أرسل استفسارك' : 'Send your Inquiry'}</p>
                            {sent ? (
                                <div className="lb-success">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                                    <p>{isRTL ? 'تم الإرسال بنجاح!' : 'Sent successfully!'}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="lb-form">
                                    <input type="text" placeholder={isRTL ? 'الاسم' : 'Name'} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                                    <input type="email" placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'} value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
                                    <input type="tel" placeholder={isRTL ? 'الهاتف' : 'Phone'} value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                                    <textarea placeholder={isRTL ? 'الرسالة' : 'Message'} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} rows={3} />
                                    <button type="submit" disabled={sending} className="lb-send-btn">{sending ? '...' : (isRTL ? 'إرسال' : 'Send')}</button>
                                </form>
                            )}
                            <div className="lb-contact-row">
                                <a href="tel:+966920031404" className="lb-contact-btn lb-call"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>{isRTL ? 'اتصال' : 'Call'}</a>
                                <a href="https://wa.me/966920031404" target="_blank" rel="noopener noreferrer" className="lb-contact-btn lb-wa"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.529-1.466A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.59l-.386-.232-2.689.87.9-2.636-.257-.405A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>{isRTL ? 'واتساب' : 'WhatsApp'}</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
