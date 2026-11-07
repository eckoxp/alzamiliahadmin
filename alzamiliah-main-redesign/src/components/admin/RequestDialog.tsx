'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { X, Mail, Phone, CalendarDays, MessageSquare } from 'lucide-react';
import s from './RequestDialog.module.css';

export { s as requestStyles };

export default function RequestDialog({
    title, id, name, email, phone, date, status, children, actions, onClose, error,
}: {
    title: string;
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    date: string;
    status: string;
    children: ReactNode;
    actions: ReactNode;
    onClose: () => void;
    error?: string;
}) {
    const locale = useLocale();
    const arabic = locale === 'ar';
    const headingId = useId();
    const dialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const element = dialog.current!;
        const previous = document.activeElement;
        const overflow = document.body.style.overflow;
        element.showModal();
        document.body.style.overflow = 'hidden';
        return () => {
            element.close();
            document.body.style.overflow = overflow;
            if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
        };
    }, []);

    return (
        <dialog ref={dialog} className={s.dialog} dir={arabic ? 'rtl' : 'ltr'} aria-labelledby={headingId}
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                const box = event.currentTarget.getBoundingClientRect();
                if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
            }}>
            <div className={s.layout}>
                <header className={s.header}>
                    <div className={s.title}><MessageSquare size={20} aria-hidden="true" />
                        <div><h2 id={headingId}>{title}</h2><span>{arabic ? 'طلب' : 'Request'} #{id}</span></div>
                    </div>
                    <button type="button" className={s.close} onClick={onClose} autoFocus aria-label={arabic ? 'إغلاق النافذة' : 'Close dialog'}><X size={19} /></button>
                </header>
                <div className={s.body}>
                    <section className={s.sender} aria-label={arabic ? 'بيانات المرسل' : 'Sender details'}>
                        <div className={s.person}><span className={s.avatar} aria-hidden="true">{name.trim().charAt(0)}</span>
                            <div><h3 dir="auto">{name}</h3><span className={s.badge}>{status}</span></div>
                        </div>
                        <dl className={s.contacts}>
                            {email && <div><dt><Mail size={15} aria-hidden="true" />{arabic ? 'البريد الإلكتروني' : 'Email'}</dt><dd><a href={`mailto:${email}`} dir="ltr">{email}</a></dd></div>}
                            {phone && <div><dt><Phone size={15} aria-hidden="true" />{arabic ? 'رقم الهاتف' : 'Phone'}</dt><dd><a href={`tel:${phone}`} dir="ltr">{phone}</a></dd></div>}
                            <div className={s.date}><dt><CalendarDays size={15} aria-hidden="true" />{arabic ? 'تاريخ الطلب' : 'Submitted'}</dt>
                                <dd>{new Date(date).toLocaleString(arabic ? 'ar-SA' : 'en-US', { calendar: 'gregory', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</dd></div>
                        </dl>
                    </section>
                    {children}
                    {error && <p className={s.error} role="alert">{error}</p>}
                </div>
                <footer className={s.footer}>{actions}</footer>
            </div>
        </dialog>
    );
}
