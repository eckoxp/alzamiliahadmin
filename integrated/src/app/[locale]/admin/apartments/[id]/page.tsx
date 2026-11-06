'use client';

import { useEffect, useState, use } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

interface Apartment {
    id: number;
    nameAr: string;
    nameEn: string | null;
    buildingName: string | null;
    floor: number | null;
    area: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    price: number | null;
    status: string;
    projectId: number;
    type: string | null;
    apartmentNumber: number | null;
    image: string | null;
    livingRoom: number | null;
    kitchen: number | null;
    driverRoom: number | null;
    maidRoom: number | null;
    balcony: number | null;
    parking: number | null;
    cars: number | null;
    garden: number | null;
    entrance: number | null;
    majlis: number | null;
    storage: number | null;
}

interface BuildingGroup {
    buildingName: string;
    apartments: Apartment[];
}

export default function ProjectApartmentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [buildings, setBuildings] = useState<BuildingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [currentBuilding, setCurrentBuilding] = useState('');
    const [editImage, setEditImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const defaultForm = {
        nameAr: '', nameEn: '', buildingName: '', floor: 1,
        area: 0, bedrooms: 3, bathrooms: 2, price: 0,
        status: 'available', type: 'A', apartmentNumber: 0,
        livingRoom: 1, kitchen: 1, driverRoom: 0, maidRoom: 0,
        balcony: 0, parking: 1, cars: 1, garden: 0,
        entrance: 1, majlis: 1, storage: 0,
    };
    const [form, setForm] = useState(defaultForm);

    const loadData = async () => {
        try {
            const pRes = await fetch(`/api/projects/${id}`);
            const pData = await pRes.json();
            const project = pData.project || pData;

            const aRes = await fetch(`/api/apartments?projectId=${id}`);
            const aData = await aRes.json();
            const apts: Apartment[] = aData.apartments || aData || [];

            // Group apartments by building name
            const grouped: Record<string, Apartment[]> = {};
            apts.forEach(apt => {
                const bName = apt.buildingName || `مبنى رقم (1)`;
                if (!grouped[bName]) grouped[bName] = [];
                grouped[bName].push(apt);
            });

            // Always create all buildings from buildingsCount, then merge apartments
            const buildingsCount = project.buildingsCount || 1;
            const buildingGroups: BuildingGroup[] = [];
            for (let i = 1; i <= buildingsCount; i++) {
                const bName = `مبنى رقم (${i})`;
                const existingApts = grouped[bName] || [];
                buildingGroups.push({
                    buildingName: bName,
                    apartments: existingApts.sort((a, b) => (a.apartmentNumber || 0) - (b.apartmentNumber || 0)),
                });
                delete grouped[bName]; // remove from grouped so we don't duplicate
            }
            // Add any extra buildings that have apartments but weren't in the 1..N range
            Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([name, apartments]) => {
                    buildingGroups.push({
                        buildingName: name,
                        apartments: apartments.sort((a, b) => (a.apartmentNumber || 0) - (b.apartmentNumber || 0)),
                    });
                });

            setBuildings(buildingGroups);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleBuilding = (name: string) => {
        setExpandedBuildings(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const openAddModal = (buildingName: string) => {
        setEditId(null);
        setCurrentBuilding(buildingName);
        setForm({ ...defaultForm, buildingName });
        setEditImage(null);
        setImageFile(null);
        setShowModal(true);
    };

    const openEditModal = (apt: Apartment) => {
        setEditId(apt.id);
        setCurrentBuilding(apt.buildingName || '');
        setEditImage(apt.image || null);
        setImageFile(null);
        setForm({
            nameAr: apt.nameAr || '', nameEn: apt.nameEn || '',
            buildingName: apt.buildingName || '',
            floor: apt.floor || 1, area: apt.area || 0,
            bedrooms: apt.bedrooms || 3, bathrooms: apt.bathrooms || 2,
            price: apt.price || 0, status: apt.status || 'available',
            type: apt.type || 'A', apartmentNumber: apt.apartmentNumber || 0,
            livingRoom: apt.livingRoom || 0, kitchen: apt.kitchen || 0,
            driverRoom: apt.driverRoom || 0, maidRoom: apt.maidRoom || 0,
            balcony: apt.balcony || 0, parking: apt.parking || 0,
            cars: apt.cars || 0, garden: apt.garden || 0,
            entrance: apt.entrance || 0, majlis: apt.majlis || 0,
            storage: apt.storage || 0,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        let imageUrl = editImage;
        // Upload image if a new file was selected
        if (imageFile) {
            const fd = new FormData();
            fd.append('file', imageFile);
            const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
            if (upRes.ok) {
                const upData = await upRes.json();
                imageUrl = upData.url || upData.path;
            }
        }
        const url = editId ? `/api/apartments/${editId}` : '/api/apartments';
        const method = editId ? 'PUT' : 'POST';
        const body = { ...form, projectId: parseInt(id), image: imageUrl };

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        setShowModal(false);
        setImageFile(null);
        loadData();
    };

    const handleDelete = async (aptId: number) => {
        if (!confirm(isRTL ? 'هل انت متأكد من حذف هذا العنصر ؟' : 'Delete this apartment?')) return;
        await fetch(`/api/apartments/${aptId}`, { method: 'DELETE' });
        loadData();
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading...</div>;
    }

    return (
        <>
            {/* Override admin container max-width for this full-width page */}
            <style>{`
                .admin-main-container { max-width: 100% !important; }
                .admin-main-v2 { padding: 16px 10px !important; }
            `}</style>

            <div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL
                        ? 'يمكنك من خلال هذا النموذج إدخال جميع الشقق الجديدة.'
                        : 'You can use this form to add all new apartments.'}
                </p>

                {/* Building Sections */}
                {buildings.map((building, idx) => (
                    <div key={idx} style={{ marginBottom: '12px' }}>
                        {/* Building Header — pink background matching original */}
                        <div style={{
                            background: '#fce4ec',
                            padding: '10px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #f8bbd0',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => openAddModal(building.buildingName)}
                                    style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '5px 14px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer' }}
                                >
                                    {isRTL ? 'إضافة' : 'Add'}
                                </button>
                                <button
                                    onClick={() => toggleBuilding(building.buildingName)}
                                    style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '5px 14px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer' }}
                                >
                                    {expandedBuildings.has(building.buildingName)
                                        ? 'close'
                                        : 'open'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'right' }}>
                                <span style={{ fontSize: '13px', color: '#555' }}>
                                    {isRTL ? `عدد الشقق ${building.apartments.length}` : `${building.apartments.length} apartments`}
                                </span>
                                <span style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>
                                    {isRTL
                                        ? `أضف عدد الشقق لمبنى رقم (${idx + 1})`
                                        : `Add apartments for Building #${idx + 1}`}
                                </span>
                            </div>
                        </div>

                        {/* Expanded Table — full width, no horizontal scroll */}
                        {expandedBuildings.has(building.buildingName) && building.apartments.length > 0 && (
                            <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                            {/* Matching original site column order (RTL): Name, Image, Type, Price, Apt#, Status, Area, Bath, Living, Kitchen, Bed, Maid, Driver, Storage, Entries, Majlis, Balcony, Parking, Garden, Private, Edit, Delete */}
                                            <th style={thS}>{isRTL ? 'رقم\nالشقة' : '#'}</th>
                                            <th style={{ ...thS, minWidth: '55px' }}>{isRTL ? 'صوره' : 'Img'}</th>
                                            <th style={thS}>{isRTL ? 'النوع' : 'Type'}</th>
                                            <th style={thS}>{isRTL ? 'السعر' : 'Price'}</th>
                                            <th style={thS}>{isRTL ? 'رقم الشقة' : 'Apt#'}</th>
                                            <th style={thS}>{isRTL ? 'الاتاحة' : 'Status'}</th>
                                            <th style={thS}>{isRTL ? 'سطح خاص' : 'Roof'}</th>
                                            <th style={thS}>{isRTL ? 'المساحه' : 'Area'}</th>
                                            <th style={thS}>{isRTL ? 'عدد الحمامات' : 'Bath'}</th>
                                            <th style={thS}>{isRTL ? 'صالة عائلية' : 'Living'}</th>
                                            <th style={thS}>{isRTL ? 'مطبخ' : 'Kitchen'}</th>
                                            <th style={thS}>{isRTL ? 'غرفة نوم' : 'Bed'}</th>
                                            <th style={thS}>{isRTL ? 'غرفة خادمة' : 'Maid'}</th>
                                            <th style={thS}>{isRTL ? 'غرفة السائق' : 'Driver'}</th>
                                            <th style={thS}>{isRTL ? 'مستودع' : 'Storage'}</th>
                                            <th style={thS}>{isRTL ? 'مدخلين' : 'Entries'}</th>
                                            <th style={thS}>{isRTL ? 'مجلس' : 'Majlis'}</th>
                                            <th style={thS}>{isRTL ? 'شرفة' : 'Balcony'}</th>
                                            <th style={thS}>{isRTL ? 'موقف سيارات' : 'Parking'}</th>
                                            <th style={thS}>{isRTL ? 'حديقة خلفية' : 'Garden'}</th>
                                            <th style={thS}>{isRTL ? 'مدخل خاص' : 'Private'}</th>
                                            <th style={thS}>{isRTL ? 'تعديل' : 'Edit'}</th>
                                            <th style={thS}>{isRTL ? 'اعدادات' : 'Del'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {building.apartments.map((apt) => (
                                            <tr key={apt.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ ...tdS, fontSize: '11px', fontWeight: 500 }}>
                                                    {apt.nameAr || `الشقة ${apt.apartmentNumber}`}
                                                </td>
                                                <td style={{ ...tdS, padding: '2px' }}>
                                                    {apt.image ? (
                                                        <img src={apt.image.startsWith('/') ? apt.image : `/${apt.image}`} alt="" style={{ width: '55px', height: '45px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                                                    ) : (
                                                        <div style={{ width: '55px', height: '45px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px', color: '#d1d5db' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={tdS}>{apt.type || 'A'}</td>
                                                <td style={{ ...tdS, fontWeight: 500 }}>{apt.price?.toLocaleString() || '-'}</td>
                                                <td style={tdS}>{apt.apartmentNumber || '-'}</td>
                                                <td style={tdS}>
                                                    <span style={{
                                                        padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 500,
                                                        background: apt.status === 'sold' ? '#fecaca' : apt.status === 'reserved' ? '#fef3c7' : '#dcfce7',
                                                        color: apt.status === 'sold' ? '#991b1b' : apt.status === 'reserved' ? '#92400e' : '#166534',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {apt.status === 'sold' ? (isRTL ? 'مباع' : 'Sold')
                                                            : apt.status === 'reserved' ? (isRTL ? 'محجوز' : 'Reserved')
                                                            : (isRTL ? 'متاح' : 'Available')}
                                                    </span>
                                                </td>
                                                <td style={tdS}>0</td>
                                                <td style={tdS}>{apt.area || '-'}</td>
                                                <td style={tdS}>{apt.bathrooms || 0}</td>
                                                <td style={tdS}>{apt.livingRoom || 0}</td>
                                                <td style={tdS}>{apt.kitchen || 0}</td>
                                                <td style={tdS}>{apt.bedrooms || 0}</td>
                                                <td style={tdS}>{apt.maidRoom || 0}</td>
                                                <td style={tdS}>{apt.driverRoom || 0}</td>
                                                <td style={tdS}>{apt.storage || 0}</td>
                                                <td style={tdS}>{apt.entrance || 0}</td>
                                                <td style={tdS}>{apt.majlis || 0}</td>
                                                <td style={tdS}>{apt.balcony || 0}</td>
                                                <td style={tdS}>{apt.parking || 0}</td>
                                                <td style={tdS}>{apt.garden || 0}</td>
                                                <td style={tdS}>
                                                    <input type="checkbox" checked={!!apt.entrance} readOnly style={{ cursor: 'pointer', width: '14px', height: '14px' }} />
                                                </td>
                                                <td style={tdS}>
                                                    <button
                                                        onClick={() => openEditModal(apt)}
                                                        style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '3px 10px', fontSize: '10px', borderRadius: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    >
                                                        {isRTL ? 'تعديل' : 'Edit'}
                                                    </button>
                                                </td>
                                                <td style={tdS}>
                                                    <span onClick={() => handleDelete(apt.id)} style={{ color: '#999', cursor: 'pointer', fontSize: '11px' }}>...</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add/Edit Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px', overflowY: 'auto' }}>
                        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '750px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', marginBottom: '40px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 700 }}>
                                    {editId
                                        ? (isRTL ? 'تعديل الشقة' : 'Edit Apartment')
                                        : (isRTL ? `إضافة شقة - ${currentBuilding}` : `Add Apartment - ${currentBuilding}`)}
                                </h3>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {[
                                    { key: 'apartmentNumber', label: isRTL ? 'رقم الشقة' : 'Apt #', type: 'number' },
                                    { key: 'type', label: isRTL ? 'النوع' : 'Type', type: 'select', options: ['A', 'B', 'C', 'C1', 'D', 'D1', 'E', 'E1', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'] },
                                    { key: 'price', label: isRTL ? 'السعر' : 'Price', type: 'number' },
                                    { key: 'floor', label: isRTL ? 'الطابق' : 'Floor', type: 'number' },
                                    { key: 'area', label: isRTL ? 'المساحة' : 'Area (m²)', type: 'number' },
                                    { key: 'bedrooms', label: isRTL ? 'غرف نوم' : 'Bedrooms', type: 'number' },
                                    { key: 'bathrooms', label: isRTL ? 'حمامات' : 'Bathrooms', type: 'number' },
                                    { key: 'livingRoom', label: isRTL ? 'صالة عائلية' : 'Living Room', type: 'number' },
                                    { key: 'kitchen', label: isRTL ? 'مطبخ' : 'Kitchen', type: 'number' },
                                    { key: 'maidRoom', label: isRTL ? 'غرفة خادمة' : 'Maid Room', type: 'number' },
                                    { key: 'driverRoom', label: isRTL ? 'غرفة سائق' : 'Driver Room', type: 'number' },
                                    { key: 'storage', label: isRTL ? 'مستودع' : 'Storage', type: 'number' },
                                    { key: 'majlis', label: isRTL ? 'مجلس' : 'Majlis', type: 'number' },
                                    { key: 'balcony', label: isRTL ? 'شرفة' : 'Balcony', type: 'number' },
                                    { key: 'parking', label: isRTL ? 'مواقف' : 'Parking', type: 'number' },
                                    { key: 'cars', label: isRTL ? 'سيارات' : 'Cars', type: 'number' },
                                    { key: 'garden', label: isRTL ? 'حديقة' : 'Garden', type: 'number' },
                                    { key: 'entrance', label: isRTL ? 'مدخل خاص' : 'Private Entrance', type: 'number' },
                                ].map(field => (
                                    <div key={field.key} className="admin-field">
                                        <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: '#555' }}>{field.label}</label>
                                        {field.type === 'select' ? (
                                            <select
                                                value={(form as any)[field.key]}
                                                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                                            >
                                                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="number"
                                                step={field.key === 'area' || field.key === 'price' ? '0.01' : '1'}
                                                value={(form as any)[field.key]}
                                                onChange={e => setForm(p => ({ ...p, [field.key]: field.key === 'area' || field.key === 'price' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 }))}
                                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                                            />
                                        )}
                                    </div>
                                ))}
                                <div className="admin-field" style={{ gridColumn: 'span 3' }}>
                                    <label style={{ fontSize: '12px', marginBottom: '4px', display: 'block', color: '#555' }}>{isRTL ? 'الحالة' : 'Status'}</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                                    >
                                        <option value="available">{isRTL ? 'متاح' : 'Available'}</option>
                                        <option value="sold">{isRTL ? 'مباع' : 'Sold'}</option>
                                        <option value="reserved">{isRTL ? 'محجوز' : 'Reserved'}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div style={{ marginTop: '16px', padding: '12px', border: '1px dashed #d1d5db', borderRadius: '8px', background: '#fafafa' }}>
                                <label style={{ fontSize: '12px', marginBottom: '8px', display: 'block', color: '#555', fontWeight: 600 }}>{isRTL ? 'صورة الشقة' : 'Apartment Image'}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {(editImage || imageFile) && (
                                        <img
                                            src={imageFile ? URL.createObjectURL(imageFile) : (editImage?.startsWith('/') ? editImage : `/${editImage}`)}
                                            alt="preview"
                                            style={{ width: '80px', height: '65px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                        />
                                    )}
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="apt-image-upload"
                                            style={{ display: 'none' }}
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) setImageFile(file);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('apt-image-upload')?.click()}
                                            style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '6px 16px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            {isRTL ? (editImage ? 'تغيير الصورة' : 'رفع صورة') : (editImage ? 'Change Image' : 'Upload Image')}
                                        </button>
                                        {editImage && (
                                            <button
                                                type="button"
                                                onClick={() => { setEditImage(null); setImageFile(null); }}
                                                style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}
                                            >
                                                {isRTL ? 'حذف' : 'Remove'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                <button onClick={() => setShowModal(false)} className="admin-btn" style={{ background: '#e5e7eb', color: '#374151' }}>
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button onClick={handleSave} className="admin-btn admin-btn-primary">
                                    {isRTL ? 'حفظ' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

/* Compact cell styles — fits all 23 columns without horizontal scroll */
const thS: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    textAlign: 'center',
    padding: '6px 2px',
    background: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
    whiteSpace: 'nowrap',
    color: '#374151',
};

const tdS: React.CSSProperties = {
    fontSize: '11px',
    textAlign: 'center',
    padding: '4px 2px',
    color: '#333',
};
