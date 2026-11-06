'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false });
const MapPicker = dynamic(() => import('@/components/admin/MapPicker'), { ssr: false });

const PROJECT_TYPES = ['شقق', 'فلل', 'دور', 'مشروع سكني', 'مستودعات', 'سكني تجاري', 'كمباوند', 'كمباوند سكني تجاري', 'كمباوند سكني'];
const CITIES = [
    'جدة', 'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر',
    'الظهران', 'الطائف', 'تبوك', 'بريدة', 'حائل', 'خميس مشيط',
    'أبها', 'نجران', 'جازان', 'ينبع', 'الأحساء', 'القطيف',
    'الجبيل', 'حفر الباطن', 'المذنب', 'القنفذة', 'ظهران الجنوب',
    'عرعر', 'سكاكا', 'الباحة', 'بيشة', 'المجمعة', 'شقراء',
    'الخرج', 'الزلفي', 'الدوادمي', 'عنيزة', 'الرس', 'رفحاء',
];

interface GalleryImage { id: number; url: string; sortOrder: number; }

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const locale = useLocale();
    const router = useRouter();
    const isRTL = locale === 'ar';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        nameAr: '', nameEn: '', livePreview: '',
        descriptionAr: '', descriptionEn: '',
        city: '',
        status: 0, statusApartment: 0, availability: 1,
        address: '', locationAr: '', locationEn: '',
        elec: 0, devices: 0, elevator: 0, air: 0, plumber: 0,
        house: 0, highQuality: 0, smartEntry: 0, fireSensor: 0,
        icon3d: '', iconFollow: '',
        lat: 24.7136, lng: 46.6753,
        type: '', linkProject: '', linkMap: '',
        excerptAr: '', excerptEn: '',
        buildYear: '', sqFit: '',
        buildingsCount: 0, unitsCount: 0, elevatorsCount: 0,
        isFeatured: 0, sortOrder: 0,
    });

    const [images, setImages] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState<string | null>(null);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [files, setFiles] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch(`/api/projects/${id}`)
            .then(res => res.json())
            .then(data => {
                const p = data.project || data;
                setForm({
                    nameAr: p.nameAr || '', nameEn: p.nameEn || '',
                    livePreview: p.livePreview || '',
                    descriptionAr: p.descriptionAr || '', descriptionEn: p.descriptionEn || '',
                    city: p.city || '',
                    status: p.status ?? 0, statusApartment: p.statusApartment ?? 0,
                    availability: p.availability ?? 1,
                    address: p.address || '', locationAr: p.locationAr || '', locationEn: p.locationEn || '',
                    elec: p.elec ?? 0, devices: p.devices ?? 0, elevator: p.elevator ?? 0,
                    air: p.air ?? 0, plumber: p.plumber ?? 0, house: p.house ?? 0,
                    highQuality: p.highQuality ?? 0, smartEntry: p.smartEntry ?? 0, fireSensor: p.fireSensor ?? 0,
                    icon3d: p.icon3d || '', iconFollow: p.iconFollow || '',
                    lat: p.lat ?? 24.7136, lng: p.lng ?? 46.6753,
                    type: p.type || '', linkProject: p.linkProject || '', linkMap: p.linkMap || '',
                    excerptAr: p.excerptAr || '', excerptEn: p.excerptEn || '',
                    buildYear: p.buildYear || '', sqFit: p.sqFit || '',
                    buildingsCount: p.buildingsCount ?? 0, unitsCount: p.unitsCount ?? 0,
                    elevatorsCount: p.elevatorsCount ?? 0,
                    isFeatured: p.isFeatured ?? 0, sortOrder: p.sortOrder ?? 0,
                });
                setImages({
                    image: p.image || '', image2: p.image2 || '', image3: p.image3 || '',
                    image4: p.image4 || '', image5: p.image5 || '', image6: p.image6 || '',
                });
                setFiles({
                    projectFile: p.projectFile || '', projectFile2: p.projectFile2 || '',
                    projectFile3: p.projectFile3 || '', video: p.video || '',
                });
                setGalleryImages(p.galleryImages || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const updateField = (field: string, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (fieldName: string, file: File) => {
        setUploading(fieldName);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const d = await res.json();
                setImages(prev => ({ ...prev, [fieldName]: d.url }));
            }
        } catch { /* ignore */ }
        setUploading(null);
    };

    const handleFileUpload = async (fieldName: string, file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const d = await res.json();
                setFiles(prev => ({ ...prev, [fieldName]: d.url }));
            }
        } catch { /* ignore */ }
    };

    const handleGalleryUpload = async (file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (res.ok) {
                const d = await res.json();
                // Add to gallery via API
                await fetch(`/api/projects/${id}/gallery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: d.url }),
                });
                // Refresh gallery
                const gRes = await fetch(`/api/projects/${id}`);
                const gData = await gRes.json();
                setGalleryImages((gData.project || gData).galleryImages || []);
            }
        } catch { /* ignore */ }
    };

    const deleteGalleryImage = async (imageId: number) => {
        try {
            await fetch(`/api/projects/${id}/gallery?imageId=${imageId}`, { method: 'DELETE' });
            setGalleryImages(prev => prev.filter(img => img.id !== imageId));
        } catch { /* ignore */ }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const body = {
            ...form,
            city: form.city,
            image: images.image || '',
            image2: images.image2 || '',
            image3: images.image3 || '',
            image4: images.image4 || '',
            image5: images.image5 || '',
            image6: images.image6 || '',
            projectFile: files.projectFile || '',
            projectFile2: files.projectFile2 || '',
            projectFile3: files.projectFile3 || '',
            video: files.video || '',
        };

        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                router.push(`/${locale}/admin/projects`);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update');
            }
        } catch {
            setError('Network error');
        }
        setSaving(false);
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading...</div>;
    }

    return (
        <div>
            <h1 className="admin-page-title">
                {isRTL ? `تعديل: ${form.nameAr}` : `Edit: ${form.nameEn || form.nameAr}`}
            </h1>

            {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="admin-form-layout">
                    {/* ====== MAIN CONTENT ====== */}
                    <div className="admin-form-main">

                        {/* Basic Info */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'تعديل المشروع' : 'Edit Project'}</h3>
                            <div className="admin-form-grid">
                                <div className="admin-field">
                                    <label>{isRTL ? 'الاسم بالعربي' : 'Name (Arabic)'} *</label>
                                    <input type="text" dir="rtl" required value={form.nameAr} onChange={e => updateField('nameAr', e.target.value)} />
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'الاسم بالانجليزي' : 'Name (English)'}</label>
                                    <input type="text" dir="ltr" value={form.nameEn} onChange={e => updateField('nameEn', e.target.value)} />
                                </div>
                                <div className="admin-field full-width">
                                    <label>{isRTL ? 'رابط البث المباشر' : 'Live Preview URL'} <span className="optional">({isRTL ? 'إختياري' : 'optional'})</span></label>
                                    <input type="text" dir="ltr" value={form.livePreview} onChange={e => updateField('livePreview', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Description AR */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'المحتوى بالعربي' : 'Content (Arabic)'}</h3>
                            <RichTextEditor content={form.descriptionAr} onChange={val => updateField('descriptionAr', val)} dir="rtl" />
                        </div>

                        {/* Description EN */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'المحتوى بالانجليزي' : 'Content (English)'}</h3>
                            <RichTextEditor content={form.descriptionEn} onChange={val => updateField('descriptionEn', val)} dir="ltr" />
                        </div>

                        {/* City & Status */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'المدينة والحالة' : 'City & Status'}</h3>
                            <div className="admin-form-grid">
                                <div className="admin-field">
                                    <label>{isRTL ? 'المدينة' : 'City'}</label>
                                    <select value={form.city} onChange={e => updateField('city', e.target.value)}>
                                        <option value="">{isRTL ? 'اختر المدينة' : 'Select city'}</option>
                                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'حالة العقار' : 'Property Status'}</label>
                                    <select value={form.status} onChange={e => updateField('status', parseInt(e.target.value))}>
                                        <option value="0">{isRTL ? 'مُباع' : 'Sold'}</option>
                                        <option value="1">{isRTL ? 'تحت الإنشاء' : 'Under Construction'}</option>
                                        <option value="3">{isRTL ? 'متاح للبيع' : 'Available'}</option>
                                        <option value="4">{isRTL ? 'قريبا' : 'Coming Soon'}</option>
                                    </select>
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'حالة المشروع' : 'Project Status'}</label>
                                    <select value={form.statusApartment} onChange={e => updateField('statusApartment', parseInt(e.target.value))}>
                                        <option value="0">...</option>
                                        <option value="1">{isRTL ? 'بيع بعد الانتهاء' : 'Sale After Completion'}</option>
                                        <option value="2">{isRTL ? 'بيع على الخريطة' : 'Off-Plan Sale'}</option>
                                    </select>
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'عرض المشروع' : 'Visibility'}</label>
                                    <select value={form.availability} onChange={e => updateField('availability', parseInt(e.target.value))}>
                                        <option value="1">{isRTL ? 'متاح' : 'Visible'}</option>
                                        <option value="0">{isRTL ? 'مخفي' : 'Hidden'}</option>
                                    </select>
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'الموقع (عربي)' : 'Location (Arabic)'}</label>
                                    <input type="text" dir="rtl" value={form.locationAr} onChange={e => updateField('locationAr', e.target.value)} />
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'الموقع (إنجليزي)' : 'Location (English)'}</label>
                                    <input type="text" dir="ltr" value={form.locationEn} onChange={e => updateField('locationEn', e.target.value)} />
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'العنوان' : 'Address'}</label>
                                    <input type="text" value={form.address} onChange={e => updateField('address', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Guarantees */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'الميزات والضمانات' : 'Features & Guarantees'}</h3>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', marginTop: '-8px' }}>
                                {isRTL ? 'أدخل عدد سنوات الضمان لكل ميزة' : 'Enter warranty years for each'}
                            </p>
                            <div className="admin-guarantee-grid">
                                {[
                                    { key: 'elec', labelAr: 'ضمان كهربا', labelEn: 'Electrical' },
                                    { key: 'devices', labelAr: 'ضمان اضاءه', labelEn: 'Lighting' },
                                    { key: 'elevator', labelAr: 'ضمان مصاعد', labelEn: 'Elevators' },
                                    { key: 'air', labelAr: 'تبريد وتكيف', labelEn: 'AC & Cooling' },
                                    { key: 'plumber', labelAr: 'صرف صحي', labelEn: 'Plumbing' },
                                    { key: 'house', labelAr: 'ضمان البناء', labelEn: 'Building' },
                                    { key: 'highQuality', labelAr: 'عوازل صوت', labelEn: 'Sound Insulation' },
                                    { key: 'smartEntry', labelAr: 'دخول ذكي', labelEn: 'Smart Entry' },
                                    { key: 'fireSensor', labelAr: 'استشعار حرائق', labelEn: 'Fire Sensor' },
                                ].map(g => (
                                    <div key={g.key} className="admin-guarantee-field">
                                        <label>{isRTL ? g.labelAr : g.labelEn}</label>
                                        <input
                                            type="number" min="0"
                                            value={form[g.key as keyof typeof form] as number}
                                            onChange={e => updateField(g.key, parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Links */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'روابط إضافية' : 'Additional Links'}</h3>
                            <div className="admin-form-grid">
                                <div className="admin-field">
                                    <label>{isRTL ? 'ثلاثي الأبعاد' : '3D View'}</label>
                                    <input type="text" dir="ltr" value={form.icon3d} onChange={e => updateField('icon3d', e.target.value)} />
                                </div>
                                <div className="admin-field">
                                    <label>{isRTL ? 'متابعة مراحل البناء' : 'Construction Progress'}</label>
                                    <input type="text" dir="ltr" value={form.iconFollow} onChange={e => updateField('iconFollow', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Map */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'الموقع على الخريطة' : 'Location on Map'}</h3>
                            <div className="admin-form-grid" style={{ marginBottom: '12px' }}>
                                <div className="admin-field">
                                    <label>Latitude</label>
                                    <input type="text" dir="ltr" value={form.lat} onChange={e => updateField('lat', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="admin-field">
                                    <label>Longitude</label>
                                    <input type="text" dir="ltr" value={form.lng} onChange={e => updateField('lng', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                            <MapPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => { updateField('lat', lat); updateField('lng', lng); }} />
                        </div>
                    </div>

                    {/* ====== SIDEBAR ====== */}
                    <div className="admin-form-sidebar">

                        {/* Type & Links */}
                        <div className="admin-section">
                            <div className="admin-field" style={{ marginBottom: '12px' }}>
                                <label>{isRTL ? 'نوع المشروع' : 'Project Type'}</label>
                                <select value={form.type} onChange={e => updateField('type', e.target.value)}>
                                    <option value="">...</option>
                                    {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="admin-field" style={{ marginBottom: '12px' }}>
                                <label>{isRTL ? 'الرابط الموقع' : 'Website URL'}</label>
                                <input type="text" dir="ltr" value={form.linkProject} onChange={e => updateField('linkProject', e.target.value)} />
                            </div>
                            <div className="admin-field" style={{ marginBottom: '12px' }}>
                                <label>{isRTL ? 'الرابط الخريطة' : 'Map URL'}</label>
                                <input type="text" dir="ltr" value={form.linkMap} onChange={e => updateField('linkMap', e.target.value)} />
                            </div>
                            <div className="admin-field">
                                <label>{isRTL ? 'الترتيب' : 'Sort Order'}</label>
                                <input type="number" value={form.sortOrder} onChange={e => updateField('sortOrder', parseInt(e.target.value) || 0)} />
                            </div>
                        </div>

                        {/* Excerpts */}
                        <div className="admin-section">
                            <div className="admin-field" style={{ marginBottom: '12px' }}>
                                <label>{isRTL ? 'نبذة مختصرة بالعربي' : 'Arabic Excerpt'}</label>
                                <textarea rows={4} dir="rtl" value={form.excerptAr} onChange={e => updateField('excerptAr', e.target.value)} />
                            </div>
                            <div className="admin-field">
                                <label>{isRTL ? 'نبذة مختصرة بالانجليزي' : 'English Excerpt'}</label>
                                <textarea rows={4} dir="ltr" value={form.excerptEn} onChange={e => updateField('excerptEn', e.target.value)} />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'صورة المشروع' : 'Project Image'}</h3>
                            <div className="admin-upload-slot">
                                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload('image', e.target.files[0])} />
                                {uploading === 'image' && <span style={{ fontSize: '12px', color: '#c9a227' }}>⏳</span>}
                                {images.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={images.image} alt="Project" />
                                )}
                            </div>
                        </div>

                        {/* Gallery */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'معرض الصور' : 'Photo Gallery'} <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>({galleryImages.length}/5)</span></h3>
                            <div className="admin-gallery-grid">
                                {galleryImages.map(img => (
                                    <div key={img.id} className="admin-gallery-item">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={img.url} alt="" />
                                        <button type="button" className="admin-gallery-delete" onClick={() => deleteGalleryImage(img.id)}>×</button>
                                    </div>
                                ))}
                            </div>
                            {galleryImages.length < 5 && (
                                <div style={{ marginTop: '8px' }}>
                                    <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                                        {isRTL ? `يمكنك إضافة ${5 - galleryImages.length} صور أخرى` : `You can add ${5 - galleryImages.length} more images`}
                                    </p>
                                    <input type="file" accept="image/*" multiple onChange={e => { if (e.target.files) Array.from(e.target.files).slice(0, 5 - galleryImages.length).forEach(f => handleGalleryUpload(f)); }} style={{ fontSize: '12px' }} />
                                </div>
                            )}
                        </div>

                        {/* Numeric Fields */}
                        <div className="admin-section">
                            {[
                                { key: 'buildYear', labelAr: 'سنة الإنشاء', labelEn: 'Build Year', type: 'number' },
                                { key: 'sqFit', labelAr: 'مساحة المشروع', labelEn: 'Area (sq ft)', type: 'number' },
                                { key: 'buildingsCount', labelAr: 'عدد المباني', labelEn: 'Buildings', type: 'number' },
                                { key: 'unitsCount', labelAr: 'عدد الوحدات', labelEn: 'Units', type: 'number' },
                                { key: 'elevatorsCount', labelAr: 'عدد المصاعد', labelEn: 'Elevators', type: 'number' },
                            ].map(f => (
                                <div key={f.key} className="admin-field" style={{ marginBottom: '12px' }}>
                                    <label>{isRTL ? f.labelAr : f.labelEn}</label>
                                    <input type={f.type} value={form[f.key as keyof typeof form] as string | number} onChange={e => updateField(f.key, f.type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)} />
                                </div>
                            ))}
                            <div className="admin-field">
                                <label>{isRTL ? 'اعرض في الصفحة الرئيسية' : 'Show on Homepage'}</label>
                                <select value={form.isFeatured} onChange={e => updateField('isFeatured', parseInt(e.target.value))}>
                                    <option value="0">{isRTL ? 'لا' : 'No'}</option>
                                    <option value="1">{isRTL ? 'نعم' : 'Yes'}</option>
                                </select>
                            </div>
                        </div>

                        {/* Files */}
                        <div className="admin-section">
                            <h3>{isRTL ? 'ملفات المشروع' : 'Project Files'}</h3>
                            {[
                                { key: 'projectFile', labelAr: 'ملف المشروع', labelEn: 'Project File' },
                                { key: 'projectFile2', labelAr: 'ملف المشروع 2', labelEn: 'File 2' },
                                { key: 'projectFile3', labelAr: 'ملف المشروع 3', labelEn: 'File 3' },
                                { key: 'video', labelAr: 'فديو للمشروع', labelEn: 'Video' },
                            ].map(f => (
                                <div key={f.key} className="admin-field" style={{ marginBottom: '12px' }}>
                                    <label>{isRTL ? f.labelAr : f.labelEn} <span className="optional">({isRTL ? 'إختياري' : 'optional'})</span></label>
                                    <input type="file" onChange={e => e.target.files?.[0] && handleFileUpload(f.key, e.target.files[0])} style={{ padding: '6px' }} />
                                    {files[f.key] && <span style={{ fontSize: '11px', color: '#059669' }}>✓ {files[f.key].split('/').pop()}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
                    <button type="button" onClick={() => router.push(`/${locale}/admin/projects`)} className="admin-btn" style={{ background: '#e5e7eb', color: '#374151' }}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ padding: '10px 32px', fontSize: '14px' }}>
                        {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التعديلات' : 'Save Changes')}
                    </button>
                </div>
            </form>
        </div>
    );
}
