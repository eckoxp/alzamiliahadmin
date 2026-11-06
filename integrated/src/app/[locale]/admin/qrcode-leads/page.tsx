'use client';

import { useLocale } from 'next-intl';

export default function ArchiveQrLeadsNotice() {
    const arabic = useLocale() === 'ar';
    return (
        <section className="admin-card">
            <h1 className="admin-page-title">{arabic ? 'طلبات QR Code' : 'QR Code Leads'}</h1>
            <p>{arabic
                ? 'ملفات إدارة طلبات QR غير موجودة في النسخة المؤرشفة. عند تركيب التصميم على النسخة الحالية، يُستخدم قسم طلبات QR الموجود فيها.'
                : 'QR lead management is missing from this archive. The current project retains its own QR lead page when the design is applied.'}</p>
        </section>
    );
}
