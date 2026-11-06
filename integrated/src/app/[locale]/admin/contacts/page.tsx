'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';

interface ContactRequest {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    status: string;
    projectId: number | null;
    createdAt: string;
}

export default function AdminContactsPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [contacts, setContacts] = useState<ContactRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);

    const loadContacts = () => {
        fetch('/api/admin/contacts')
            .then(res => res.json())
            .then(data => {
                setContacts(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadContacts(); }, []);

    const markAsReviewed = async (id: number) => {
        await fetch('/api/admin/contacts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'reviewed' }),
        });
        setContacts(prev => prev.map(c => c.id === id ? { ...c, status: 'reviewed' } : c));
        if (selectedContact?.id === id) setSelectedContact(prev => prev ? { ...prev, status: 'reviewed' } : null);
    };

    const deleteContact = async (id: number) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) return;
        await fetch('/api/admin/contacts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setContacts(prev => prev.filter(c => c.id !== id));
        if (selectedContact?.id === id) setSelectedContact(null);
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '60px' }}><div className="loading-spinner" /></div>;
    }

    return (
        <div>
            <h1 className="admin-page-title">
                {isRTL ? 'طلبات التواصل' : 'Contact Requests'}
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: selectedContact ? '1fr 1fr' : '1fr', gap: '20px' }}>
                {/* Table */}
                <div className="admin-card" style={{ overflow: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{isRTL ? 'الاسم' : 'Name'}</th>
                                <th>{isRTL ? 'البريد' : 'Email'}</th>
                                <th>{isRTL ? 'الهاتف' : 'Phone'}</th>
                                <th>{isRTL ? 'الحالة' : 'Status'}</th>
                                <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map(c => (
                                <tr
                                    key={c.id}
                                    onClick={() => setSelectedContact(c)}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedContact?.id === c.id ? '#f3f4f6' : undefined,
                                    }}
                                >
                                    <td>{c.id}</td>
                                    <td><strong>{c.name}</strong></td>
                                    <td style={{ fontSize: '13px' }}>{c.email}</td>
                                    <td style={{ fontSize: '13px' }}>{c.phone || '-'}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 600,
                                            background: c.status === 'new' ? '#e3f2fd' : '#e8f5e9',
                                            color: c.status === 'new' ? '#1565c0' : '#2e7d32',
                                        }}>
                                            {c.status === 'new' ? (isRTL ? 'جديد' : 'New') : (isRTL ? 'تمت المراجعة' : 'Reviewed')}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                        {new Date(c.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                                    </td>
                                    <td>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteContact(c.id); }}
                                            className="admin-btn-icon danger"
                                            title={isRTL ? 'حذف' : 'Delete'}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {contacts.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        {isRTL ? 'لا توجد طلبات تواصل' : 'No contact requests'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                {selectedContact && (
                    <div className="admin-card" style={{ padding: '24px', position: 'sticky', top: '20px', alignSelf: 'start' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>
                                {isRTL ? 'تفاصيل الرسالة' : 'Message Details'}
                            </h3>
                            <button
                                onClick={() => setSelectedContact(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Name */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{isRTL ? 'الاسم' : 'Name'}</div>
                                <div style={{ fontSize: '15px', fontWeight: 600 }}>{selectedContact.name}</div>
                            </div>

                            {/* Email */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{isRTL ? 'البريد الإلكتروني' : 'Email'}</div>
                                <a href={`mailto:${selectedContact.email}`} style={{ fontSize: '14px', color: '#1565c0' }}>{selectedContact.email}</a>
                            </div>

                            {/* Phone */}
                            {selectedContact.phone && (
                                <div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{isRTL ? 'رقم الهاتف' : 'Phone'}</div>
                                    <a href={`tel:${selectedContact.phone}`} style={{ fontSize: '14px', color: '#1565c0' }}>{selectedContact.phone}</a>
                                </div>
                            )}

                            {/* Date */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{isRTL ? 'التاريخ' : 'Date'}</div>
                                <div style={{ fontSize: '14px' }}>
                                    {new Date(selectedContact.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{isRTL ? 'الحالة' : 'Status'}</div>
                                <span style={{
                                    padding: '4px 12px', borderRadius: '5px', fontSize: '13px', fontWeight: 600,
                                    background: selectedContact.status === 'new' ? '#e3f2fd' : '#e8f5e9',
                                    color: selectedContact.status === 'new' ? '#1565c0' : '#2e7d32',
                                }}>
                                    {selectedContact.status === 'new' ? (isRTL ? 'جديد' : 'New') : (isRTL ? 'تمت المراجعة' : 'Reviewed')}
                                </span>
                            </div>

                            {/* Message */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{isRTL ? 'الرسالة' : 'Message'}</div>
                                <div style={{
                                    fontSize: '14px', lineHeight: 1.7, padding: '14px', borderRadius: '8px',
                                    background: '#f9fafb', border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap',
                                }}>
                                    {selectedContact.message}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                {selectedContact.status === 'new' && (
                                    <button
                                        onClick={() => markAsReviewed(selectedContact.id)}
                                        className="admin-btn admin-btn-primary"
                                        style={{ fontSize: '13px', padding: '8px 20px' }}
                                    >
                                        {isRTL ? '✓ تم المراجعة' : '✓ Mark Reviewed'}
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteContact(selectedContact.id)}
                                    className="admin-btn"
                                    style={{ fontSize: '13px', padding: '8px 20px', background: '#fee2e2', color: '#991b1b' }}
                                >
                                    {isRTL ? 'حذف' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
