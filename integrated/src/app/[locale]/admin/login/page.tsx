'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';

export default function AdminLoginPage() {
    const locale = useLocale();
    const router = useRouter();
    const isRTL = locale === 'ar';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/${locale}/admin`);
            } else {
                setError(data.error || (isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password'));
            }
        } catch {
            setError(isRTL ? 'خطأ في الاتصال بالخادم' : 'Server connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=2070&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '20px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '900px',
                display: 'flex',
                borderRadius: '12px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                overflow: 'hidden',
            }}>
                {/* Left Panel - Branding */}
                <div style={{
                    width: '40%',
                    background: 'linear-gradient(135deg, #1a2a3a 0%, #2d3b4a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    textAlign: 'center',
                }} className="hide-mobile">
                    <Image src="/images/logow.png" alt="Alzamiliah" width={120} height={96} style={{ height: '96px', width: 'auto', marginBottom: '15px' }} />
                    <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                        {isRTL ? 'الزاملية للاستثمار' : 'Alzamiliah Investment'}
                    </h2>
                    <p style={{ color: '#bc8664', fontSize: '14px' }}>
                        {isRTL ? 'تسجيل الدخول هنا فقط للمسؤولين' : 'Admin access only'}
                    </p>
                </div>

                {/* Right Panel - Login Form */}
                <div style={{
                    flex: 1,
                    background: '#fff',
                    padding: '50px 40px',
                }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '30px' }}>
                        {isRTL ? 'تسجيل الدخول إلى حسابك' : 'Login to your account'}
                    </h1>

                    {error && (
                        <div style={{
                            background: '#fff5f5', border: '1px solid #fc8181', color: '#c53030',
                            padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-group">
                            <label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={isRTL ? 'البريد الإلكتروني' : 'Email address'}
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label>{isRTL ? 'كلمة المرور' : 'Password'}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="admin-btn admin-btn-primary"
                            style={{ width: '100%', padding: '14px', fontSize: '16px', justifyContent: 'center', marginTop: '10px' }}
                        >
                            {loading
                                ? (isRTL ? 'جاري تسجيل الدخول...' : 'Logging in...')
                                : (isRTL ? 'تسجيل الدخول' : 'Login')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
