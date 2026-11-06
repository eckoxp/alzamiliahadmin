'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    const contactInfo = [
        {
            icon: 'fa-building',
            title: isRTL ? 'العنوان' : 'Address',
            value: isRTL
                ? 'المملكة العربية السعودية، الرياض، حي الصحافة، طريق العليا'
                : 'Saudi Arabia, Riyadh, Al Sahafa District, Olaya Road'
        },
        {
            icon: 'fa-phone',
            title: isRTL ? 'الهاتف' : 'Phone',
            value: '920031404',
            href: 'https://api.whatsapp.com/send/?phone=966920031404'
        },
        {
            icon: 'fa-envelope',
            title: isRTL ? 'البريد الإلكتروني' : 'Email',
            value: 'info@alzamiliah.com',
            href: 'mailto:info@alzamiliah.com'
        },
    ];

    return (
        <>
            <Header forceWhite />

            <main style={{ paddingTop: '77px' }}>
                {/* Page Header */}
                <div className="page-header">
                    <div className="container">
                        <h1>{isRTL ? 'تواصل معنا' : 'Contact Us'}</h1>
                        <p>
                            {isRTL
                                ? 'نسعد بتواصلكم معنا والإجابة على جميع استفساراتكم'
                                : 'We are happy to communicate with you and answer all your inquiries'
                            }
                        </p>
                    </div>
                </div>

                {/* Contact Content */}
                <section className="section">
                    <div className="container">
                        <div className="contact-grid">
                            {/* Contact Form */}
                            <div>
                                <h2 style={{ fontSize: '24px', marginBottom: '25px' }}>
                                    {isRTL ? 'أرسل رسالة' : 'Send a Message'}
                                </h2>
                                <form onSubmit={handleSubmit} className="contact-form">
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="tel"
                                        placeholder={isRTL ? 'رقم الجوال' : 'Phone Number'}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                    <textarea
                                        placeholder={isRTL ? 'رسالتك' : 'Your Message'}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        rows={5}
                                    />
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={status === 'loading'}
                                        style={{ width: '100%' }}
                                    >
                                        {status === 'loading'
                                            ? (isRTL ? 'جاري الإرسال...' : 'Sending...')
                                            : (isRTL ? 'إرسال الرسالة' : 'Send Message')
                                        }
                                    </button>

                                    {status === 'success' && (
                                        <p style={{ color: 'var(--color-accent)', marginTop: '15px', textAlign: 'center' }}>
                                            {isRTL ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent successfully!'}
                                        </p>
                                    )}
                                    {status === 'error' && (
                                        <p style={{ color: '#e74c3c', marginTop: '15px', textAlign: 'center' }}>
                                            {isRTL ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again'}
                                        </p>
                                    )}
                                </form>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h2 style={{ fontSize: '24px', marginBottom: '25px' }}>
                                    {isRTL ? 'معلومات التواصل' : 'Contact Information'}
                                </h2>
                                <div>
                                    {contactInfo.map((item, index) => (
                                        <div key={index} className="contact-info-card">
                                            <div className="contact-icon">
                                                <i className={`fas ${item.icon}`}></i>
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '14px', color: 'var(--color-text-light)', marginBottom: '5px' }}>
                                                    {item.title}
                                                </h4>
                                                {item.href ? (
                                                    <a href={item.href} style={{ color: 'var(--color-text)', fontSize: '16px' }}>
                                                        {item.value}
                                                    </a>
                                                ) : (
                                                    <p style={{ color: 'var(--color-text)', fontSize: '16px', margin: 0 }}>
                                                        {item.value}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Working Hours */}
                                <div style={{ marginTop: '30px', padding: '25px', background: 'var(--footer-bg)', borderRadius: '10px', color: '#fff' }}>
                                    <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>
                                        <i className="fas fa-clock" style={{ marginInlineEnd: '10px' }}></i>
                                        {isRTL ? 'ساعات العمل' : 'Working Hours'}
                                    </h3>
                                    <p style={{ marginBottom: '8px', opacity: 0.9 }}>
                                        {isRTL ? 'الأحد - الخميس: 9 صباحاً - 6 مساءً' : 'Sunday - Thursday: 9 AM - 6 PM'}
                                    </p>
                                    <p style={{ opacity: 0.9, margin: 0 }}>
                                        {isRTL ? 'الجمعة - السبت: مغلق' : 'Friday - Saturday: Closed'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
