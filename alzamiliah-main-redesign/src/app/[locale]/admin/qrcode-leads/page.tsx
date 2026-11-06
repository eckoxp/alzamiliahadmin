'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

interface Project {
    id: number;
    nameAr: string;
    nameEn: string | null;
    locationAr: string | null;
    locationEn: string | null;
}

interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    contactMethod: 'PHONE' | 'WHATSAPP' | 'EMAIL';
    status: string;
    createdAt: string;
    projects: { project: Project }[];
}

const CONTACT_METHOD_LABELS: Record<string, { ar: string; en: string; color: string }> = {
    PHONE:    { ar: 'هاتف',      en: 'Phone',     color: '#bc8664' },
    WHATSAPP: { ar: 'واتساب',    en: 'WhatsApp',  color: '#22c55e' },
    EMAIL:    { ar: 'بريد إلكتروني', en: 'Email', color: '#805641' },
};

export default function AdminQrLeadsPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Lead | null>(null);
    const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'closed'>('all');

    const loadLeads = () => {
        fetch('/api/admin/qrcode-leads')
            .then(r => r.json())
            .then(data => { setLeads(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadLeads(); }, []);

    const updateStatus = async (id: number, status: string) => {
        await fetch('/api/admin/qrcode-leads', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    };

    const deleteLead = async (id: number) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Delete this lead?')) return;
        await fetch('/api/admin/qrcode-leads', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
    const newCount = leads.filter(l => l.status === 'new').length;

    const statusStyle = (status: string) => {
        const map: Record<string, { bg: string; color: string; label: { ar: string; en: string } }> = {
            new:       { bg: '#f8eee7', color: '#6a4535', label: { ar: 'جديد',        en: 'New' } },
            contacted: { bg: '#f0fdf4', color: '#15803d', label: { ar: 'تم التواصل',  en: 'Contacted' } },
            closed:    { bg: '#f3f4f6', color: '#6b7280', label: { ar: 'مغلق',        en: 'Closed' } },
        };
        return map[status] || map.new;
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="loading-spinner" />
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="admin-page-title" style={{ margin: 0 }}>
                        {isRTL ? 'طلبات QR Code' : 'QR Code Leads'}
                    </h1>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                        {isRTL
                            ? `${leads.length} طلب إجمالي${newCount > 0 ? ` · ${newCount} جديد` : ''}`
                            : `${leads.length} total${newCount > 0 ? ` · ${newCount} new` : ''}`}
                    </p>
                </div>
                {newCount > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#f8eee7', border: '1px solid #e8cebc',
                        borderRadius: '10px', padding: '10px 16px',
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#bc8664', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6a4535' }}>
                            {isRTL ? `${newCount} طلب جديد يحتاج متابعة` : `${newCount} new lead${newCount > 1 ? 's' : ''} need attention`}
                        </span>
                    </div>
                )}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {(['all', 'new', 'contacted', 'closed'] as const).map(f => {
                    const labels: Record<string, { ar: string; en: string }> = {
                        all:       { ar: 'الكل',       en: 'All' },
                        new:       { ar: 'جديد',       en: 'New' },
                        contacted: { ar: 'تم التواصل', en: 'Contacted' },
                        closed:    { ar: 'مغلق',       en: 'Closed' },
                    };
                    const count = f === 'all' ? leads.length : leads.filter(l => l.status === f).length;
                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                border: filter === f ? '1.5px solid #5c3a21' : '1.5px solid #e5e7eb',
                                background: filter === f ? '#5c3a21' : '#fff',
                                color: filter === f ? '#fff' : '#374151',
                                cursor: 'pointer',
                            }}
                        >
                            {isRTL ? labels[f].ar : labels[f].en}
                            <span style={{
                                marginRight: isRTL ? '6px' : 0, marginLeft: isRTL ? 0 : '6px',
                                fontSize: '11px', opacity: 0.75,
                            }}>({count})</span>
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '20px', alignItems: 'start' }}>

                {/* Table */}
                <div className="admin-card" style={{ overflow: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{isRTL ? 'الاسم' : 'Name'}</th>
                                <th>{isRTL ? 'الهاتف' : 'Phone'}</th>
                                <th>{isRTL ? 'التواصل' : 'Contact Via'}</th>
                                <th>{isRTL ? 'المشاريع' : 'Projects'}</th>
                                <th>{isRTL ? 'الحالة' : 'Status'}</th>
                                <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(lead => {
                                const st = statusStyle(lead.status);
                                const cm = CONTACT_METHOD_LABELS[lead.contactMethod];
                                return (
                                    <tr
                                        key={lead.id}
                                        onClick={() => setSelected(lead)}
                                        style={{ cursor: 'pointer', background: selected?.id === lead.id ? '#faf8f5' : undefined }}
                                    >
                                        <td style={{ color: '#9ca3af', fontSize: '12px' }}>{lead.id}</td>
                                        <td>
                                            <strong style={{ fontSize: '14px' }}>{lead.name}</strong>
                                            {lead.status === 'new' && (
                                                <span style={{
                                                    marginRight: isRTL ? '6px' : 0, marginLeft: isRTL ? 0 : '6px',
                                                    display: 'inline-block', width: '7px', height: '7px',
                                                    borderRadius: '50%', background: '#bc8664', verticalAlign: 'middle',
                                                }} />
                                            )}
                                        </td>
                                        <td>
                                            <a href={`tel:${lead.phone}`} dir="ltr"
                                                onClick={e => e.stopPropagation()}
                                                style={{ fontSize: '13px', color: '#6a4535', textDecoration: 'none' }}>
                                                {lead.phone}
                                            </a>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                                                borderRadius: '5px', background: `${cm.color}18`, color: cm.color,
                                            }}>
                                                {isRTL ? cm.ar : cm.en}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: '#374151' }}>
                                            {lead.projects.length === 0
                                                ? <span style={{ color: '#9ca3af' }}>—</span>
                                                : lead.projects.map(p => (
                                                    <span key={p.project.id} style={{
                                                        display: 'inline-block', marginLeft: isRTL ? 0 : '4px',
                                                        marginRight: isRTL ? '4px' : 0, marginBottom: '3px',
                                                        padding: '2px 8px', borderRadius: '5px',
                                                        background: 'rgba(92,58,33,0.08)', color: '#5c3a21',
                                                        fontSize: '11px', fontWeight: 600,
                                                    }}>
                                                        {isRTL ? p.project.nameAr : p.project.nameEn || p.project.nameAr}
                                                    </span>
                                                ))
                                            }
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: '5px',
                                                fontSize: '12px', fontWeight: 600,
                                                background: st.bg, color: st.color,
                                            }}>
                                                {isRTL ? st.label.ar : st.label.en}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                            {new Date(lead.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                                        </td>
                                        <td>
                                            <button
                                                onClick={e => { e.stopPropagation(); deleteLead(lead.id); }}
                                                className="admin-btn-icon danger"
                                                title={isRTL ? 'حذف' : 'Delete'}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                                        {isRTL ? 'لا توجد طلبات' : 'No leads found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail panel */}
                {selected && (
                    <div className="admin-card" style={{ padding: '24px', position: 'sticky', top: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                {isRTL ? 'تفاصيل الطلب' : 'Lead Details'}
                            </h3>
                            <button onClick={() => setSelected(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Name */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isRTL ? 'الاسم' : 'Name'}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{selected.name}</div>
                            </div>

                            {/* Phone */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isRTL ? 'رقم الهاتف' : 'Phone'}
                                </div>
                                <a href={`tel:${selected.phone}`} dir="ltr"
                                    style={{ fontSize: '15px', fontWeight: 600, color: '#6a4535', textDecoration: 'none' }}>
                                    {selected.phone}
                                </a>
                            </div>

                            {/* Contact method */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isRTL ? 'طريقة التواصل المفضلة' : 'Preferred Contact'}
                                </div>
                                {(() => {
                                    const cm = CONTACT_METHOD_LABELS[selected.contactMethod];
                                    return (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 14px', borderRadius: '8px',
                                            background: `${cm.color}15`, color: cm.color,
                                            fontWeight: 700, fontSize: '13px',
                                        }}>
                                            {selected.contactMethod === 'WHATSAPP' && (
                                                <a
                                                    href={`https://wa.me/${selected.phone.replace(/[\s\-+]/g, '')}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    style={{ color: 'inherit', textDecoration: 'none' }}
                                                >
                                                    {isRTL ? cm.ar : cm.en} ↗
                                                </a>
                                            )}
                                            {selected.contactMethod !== 'WHATSAPP' && (isRTL ? cm.ar : cm.en)}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Email */}
                            {selected.email && (
                                <div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                    </div>
                                    <a href={`mailto:${selected.email}`}
                                        style={{ fontSize: '13px', color: '#6a4535', textDecoration: 'none' }}>
                                        {selected.email}
                                    </a>
                                </div>
                            )}

                            {/* Projects */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isRTL ? 'المشاريع المطلوبة' : 'Requested Projects'}
                                </div>
                                {selected.projects.length === 0
                                    ? <span style={{ fontSize: '13px', color: '#9ca3af' }}>{isRTL ? 'لم يحدد مشروعاً' : 'No project selected'}</span>
                                    : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selected.projects.map(p => (
                                                <div key={p.project.id} style={{
                                                    padding: '10px 14px', borderRadius: '8px',
                                                    background: 'rgba(92,58,33,0.06)', border: '1px solid rgba(92,58,33,0.1)',
                                                }}>
                                                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#5c3a21' }}>
                                                        {isRTL ? p.project.nameAr : p.project.nameEn || p.project.nameAr}
                                                    </div>
                                                    {(isRTL ? p.project.locationAr : p.project.locationEn || p.project.locationAr) && (
                                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                                            {isRTL ? p.project.locationAr : p.project.locationEn || p.project.locationAr}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }
                            </div>

                            {/* Date */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isRTL ? 'تاريخ الطلب' : 'Submitted'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#374151' }}>
                                    {new Date(selected.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </div>
                            </div>

                            {/* Status actions */}
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isRTL ? 'تحديث الحالة' : 'Update Status'}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {selected.status !== 'contacted' && (
                                        <button
                                            onClick={() => updateStatus(selected.id, 'contacted')}
                                            className="admin-btn admin-btn-primary"
                                            style={{ fontSize: '12px', padding: '7px 14px' }}
                                        >
                                            {isRTL ? '✓ تم التواصل' : '✓ Mark Contacted'}
                                        </button>
                                    )}
                                    {selected.status !== 'closed' && (
                                        <button
                                            onClick={() => updateStatus(selected.id, 'closed')}
                                            className="admin-btn"
                                            style={{ fontSize: '12px', padding: '7px 14px', background: '#f3f4f6', color: '#374151' }}
                                        >
                                            {isRTL ? 'إغلاق' : 'Close'}
                                        </button>
                                    )}
                                    {selected.status !== 'new' && (
                                        <button
                                            onClick={() => updateStatus(selected.id, 'new')}
                                            className="admin-btn"
                                            style={{ fontSize: '12px', padding: '7px 14px', background: '#f8eee7', color: '#6a4535' }}
                                        >
                                            {isRTL ? 'إعادة فتح' : 'Reopen'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => deleteLead(selected.id)}
                                className="admin-btn"
                                style={{ fontSize: '12px', padding: '7px 14px', background: '#fee2e2', color: '#991b1b', marginTop: '4px' }}
                            >
                                {isRTL ? 'حذف الطلب' : 'Delete Lead'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}