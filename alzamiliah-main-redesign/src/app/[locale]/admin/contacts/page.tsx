'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import RequestDialog, { requestStyles as detail } from '@/components/admin/RequestDialog';

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
    const [actionBusy, setActionBusy] = useState(false);
    const [actionError, setActionError] = useState("");
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
        if (actionBusy) return;
        setActionBusy(true);
        setActionError("");
        try {
            const response = await fetch('/api/admin/contacts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'reviewed' }),
            });
            if (!response.ok) throw new Error("Request failed");
            setContacts(prev => prev.map(c => c.id === id ? { ...c, status: 'reviewed' } : c));
            if (selectedContact?.id === id) setSelectedContact(prev => prev?.id === id ? { ...prev, status: 'reviewed' } : prev);
        } catch {
            setActionError(isRTL ? "تعذّر حفظ التغيير. حاول مرة أخرى." : "Could not save the change. Try again.");
        } finally {
            setActionBusy(false);
        }
    };

    const deleteContact = async (id: number) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) return;
        if (actionBusy) return;
        setActionBusy(true);
        setActionError("");
        try {
            const response = await fetch('/api/admin/contacts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
            });
            if (!response.ok) throw new Error("Request failed");
            setContacts(prev => prev.filter(c => c.id !== id));
            setSelectedContact(previous => previous?.id === id ? null : previous);
        } catch {
            setActionError(isRTL ? "تعذّر حفظ التغيير. حاول مرة أخرى." : "Could not save the change. Try again.");
        } finally {
            setActionBusy(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '60px' }}><div className="loading-spinner" /></div>;
    }

    return (
        <div>
            <h1 className="admin-page-title">
                {isRTL ? 'طلبات التواصل' : 'Contact Requests'}
            </h1>

            {actionError && !selectedContact && <p className={detail.error} role="alert">{actionError}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
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
                                    onClick={() => { setActionError(""); setSelectedContact(c); }}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedContact?.id === c.id ? '#f3f4f6' : undefined,
                                    }}
                                >
                                    <td>{c.id}</td>
                                    <td><button className="admin-btn-icon" aria-haspopup="dialog" onClick={(event) => { event.stopPropagation(); setActionError(""); setSelectedContact(c); }}><strong>{c.name}</strong></button></td>
                                    <td style={{ fontSize: '13px' }}>{c.email}</td>
                                    <td style={{ fontSize: '13px' }}>{c.phone || '-'}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 600,
                                            background: c.status === 'new' ? '#f8eee7' : '#e8f5e9',
                                            color: c.status === 'new' ? '#694537' : '#2e7d32',
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

                {selectedContact && (
                    <RequestDialog title={isRTL ? 'تفاصيل الرسالة' : 'Message details'}
                        id={selectedContact.id} name={selectedContact.name} email={selectedContact.email}
                        phone={selectedContact.phone} date={selectedContact.createdAt}
                        status={selectedContact.status === 'new' ? (isRTL ? 'جديد' : 'New') : (isRTL ? 'تمت المراجعة' : 'Reviewed')}
                        onClose={() => setSelectedContact(null)} error={actionError}
                        actions={<>
                            {selectedContact.status === 'new' && (
                                <button disabled={actionBusy} onClick={() => markAsReviewed(selectedContact.id)} className="admin-btn admin-btn-primary">
                                    {isRTL ? 'تمت المراجعة' : 'Mark reviewed'}
                                </button>
                            )}
                            <button disabled={actionBusy} onClick={() => deleteContact(selectedContact.id)} className={`admin-btn ${detail.delete}`}>
                                {isRTL ? 'حذف الطلب' : 'Delete request'}
                            </button>
                        </>}>
                        <section className={detail.section}>
                            <h3>{isRTL ? 'الرسالة' : 'Message'}</h3>
                            <div className={detail.message} dir="auto">{selectedContact.message}</div>
                        </section>
                    </RequestDialog>
                )}
            </div>
        </div>
    );
}
