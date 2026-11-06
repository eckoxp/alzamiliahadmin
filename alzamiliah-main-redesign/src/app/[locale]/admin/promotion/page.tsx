'use client';

import { useLocale } from 'next-intl';

export default function PromotionPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    return (
        <div>
            <h1 className="admin-page-title">{isRTL ? 'ترويج للموقع' : 'Site Promotion'}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {/* SEO Card */}
                <div className="admin-card">
                    <h2>🔍 {isRTL ? 'تحسين محركات البحث' : 'SEO Optimization'}</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8, marginBottom: '16px' }}>
                        {isRTL
                            ? 'تم تحسين موقعك لمحركات البحث. يتم تحديث بيانات SEO تلقائياً مع كل مشروع جديد.'
                            : 'Your site is optimized for search engines. SEO data is automatically updated with each new project.'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="admin-badge admin-badge-green">{isRTL ? 'مفعل' : 'Active'}</span>
                        <span className="admin-badge admin-badge-blue">Google Analytics</span>
                    </div>
                </div>

                {/* Social Media Card */}
                <div className="admin-card">
                    <h2>📱 {isRTL ? 'وسائل التواصل الاجتماعي' : 'Social Media'}</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8, marginBottom: '16px' }}>
                        {isRTL
                            ? 'يمكنك مشاركة مشاريعك مباشرة على منصات التواصل الاجتماعي لزيادة الوصول.'
                            : 'Share your projects directly on social media platforms to increase reach.'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="admin-badge admin-badge-blue">Twitter/X</span>
                        <span className="admin-badge admin-badge-green">Instagram</span>
                        <span className="admin-badge admin-badge-blue">LinkedIn</span>
                    </div>
                </div>

                {/* WhatsApp Card */}
                <div className="admin-card">
                    <h2>💬 {isRTL ? 'واتساب' : 'WhatsApp'}</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.8, marginBottom: '16px' }}>
                        {isRTL
                            ? 'زر واتساب العائم مفعل على الموقع لتسهيل التواصل مع العملاء.'
                            : 'Floating WhatsApp button is enabled on the site for easy customer communication.'}
                    </p>
                    <span className="admin-badge admin-badge-green">{isRTL ? 'مفعل' : 'Active'}</span>
                </div>
            </div>

            {/* Analytics Overview */}
            <div className="admin-card">
                <h2>📊 {isRTL ? 'نصائح للترويج' : 'Promotion Tips'}</h2>
                <ul style={{ fontSize: '13px', color: '#6b7280', lineHeight: 2, paddingInlineStart: '20px' }}>
                    <li>{isRTL ? 'انشر مشاريعك الجديدة على جميع منصات التواصل الاجتماعي' : 'Share new projects on all social media platforms'}</li>
                    <li>{isRTL ? 'استخدم صور عالية الجودة لجذب المزيد من العملاء' : 'Use high-quality images to attract more clients'}</li>
                    <li>{isRTL ? 'حدث محتوى الموقع بانتظام لتحسين ترتيبه في محركات البحث' : 'Update site content regularly to improve search rankings'}</li>
                    <li>{isRTL ? 'استجب لطلبات التواصل بسرعة لزيادة معدل التحويل' : 'Respond quickly to contact requests to increase conversion'}</li>
                    <li>{isRTL ? 'أضف وصفاً مفصلاً لكل مشروع بالعربي والإنجليزي' : 'Add detailed descriptions for each project in both languages'}</li>
                </ul>
            </div>
        </div>
    );
}
