'use client';

import { useState } from 'react';

export default function ContactForm({ isRTL }: { isRTL: boolean }) {
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setError('');
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setSuccess(true);
                setForm({ name: '', email: '', phone: '', message: '' });
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to send');
            }
        } catch {
            setError('Network error');
        }
        setSending(false);
    };

    return (
        <form className="contact-form-home" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder={isRTL ? 'الاسم' : 'Name'}
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
            <input
                type="email"
                placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
            <input
                type="tel"
                dir={isRTL ? 'rtl' : 'ltr'}
                placeholder={isRTL ? 'الهاتف' : 'Phone'}
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            />
            <textarea
                placeholder={isRTL ? 'الرسالة' : 'Message'}
                rows={4}
                required
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            />
            {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
            {success && (
                <p style={{ color: 'green', fontSize: '14px' }}>
                    {isRTL ? 'تم الإرسال بنجاح!' : 'Sent successfully!'}
                </p>
            )}
            <button type="submit" className="btn-primary" disabled={sending}>
                {sending
                    ? (isRTL ? 'جاري الإرسال...' : 'Sending...')
                    : (isRTL ? 'إرسال' : 'Send')}
            </button>
        </form>
    );
}