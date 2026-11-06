import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
        title: locale === 'ar' ? 'سياسة الخصوصية | الزاملية' : 'Privacy Policy | Alzamiliah',
        description: locale === 'ar' ? 'سياسة الخصوصية لشركة الزاملية للاستثمار والتطوير العقاري' : 'Privacy Policy for Alzamiliah Investment & Real Estate Development',
    };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const isRTL = locale === 'ar';

    return (
        <>
            <Header forceWhite />
            <main className="legal-page" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="legal-hero">
                    <div className="container">
                        <nav className="legal-breadcrumb">
                            <Link href={`/${locale}`}>{isRTL ? 'الرئيسية' : 'Home'}</Link>
                            <span className="legal-sep">/</span>
                            <span>{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
                        </nav>
                        <h1>{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
                        <p className="legal-updated">{isRTL ? 'آخر تحديث: يناير 2025' : 'Last Updated: January 2025'}</p>
                    </div>
                </div>

                <div className="legal-content">
                    <div className="container">
                        <div className="legal-card">
                            {isRTL ? (
                                <>
                                    <section className="legal-section">
                                        <h2>مقدمة</h2>
                                        <p>مرحبًا بكم في شركة الزاملية للاستثمار والتطوير العقاري. نلتزم بحماية خصوصيتكم وبياناتكم الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتكم عند استخدام موقعنا الإلكتروني وخدماتنا.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>المعلومات التي نجمعها</h2>
                                        <div className="legal-list">
                                            <div className="legal-list-item">
                                                <div className="legal-list-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                </div>
                                                <div>
                                                    <h3>المعلومات الشخصية</h3>
                                                    <p>الاسم الكامل، عنوان البريد الإلكتروني، رقم الهاتف، والعنوان عند تسجيلكم أو تواصلكم معنا.</p>
                                                </div>
                                            </div>
                                            <div className="legal-list-item">
                                                <div className="legal-list-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                                                </div>
                                                <div>
                                                    <h3>بيانات التصفح</h3>
                                                    <p>عنوان IP، نوع المتصفح، الصفحات التي تمت زيارتها، ومدة الزيارة لتحسين تجربة المستخدم.</p>
                                                </div>
                                            </div>
                                            <div className="legal-list-item">
                                                <div className="legal-list-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                </div>
                                                <div>
                                                    <h3>بيانات العقارات</h3>
                                                    <p>تفضيلات البحث عن العقارات، الاستفسارات المقدمة، وسجل التعاملات.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="legal-section">
                                        <h2>كيف نستخدم معلوماتكم</h2>
                                        <ul>
                                            <li>تقديم خدماتنا العقارية وتحسينها</li>
                                            <li>التواصل معكم بشأن الاستفسارات والعروض</li>
                                            <li>إرسال التحديثات حول المشاريع الجديدة (بموافقتكم)</li>
                                            <li>تحليل استخدام الموقع لتحسين الأداء</li>
                                            <li>الامتثال للمتطلبات القانونية والتنظيمية في المملكة العربية السعودية</li>
                                        </ul>
                                    </section>

                                    <section className="legal-section">
                                        <h2>حماية البيانات</h2>
                                        <p>نطبق إجراءات أمنية تقنية وتنظيمية مناسبة لحماية بياناتكم الشخصية من الوصول غير المصرح به أو التغيير أو الكشف أو الإتلاف. تشمل هذه الإجراءات تشفير البيانات وجدران الحماية وضوابط الوصول.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>ملفات تعريف الارتباط (الكوكيز)</h2>
                                        <p>يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربة التصفح. يمكنكم التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحكم، علمًا بأن تعطيلها قد يؤثر على بعض وظائف الموقع.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>حقوقكم</h2>
                                        <ul>
                                            <li>الوصول إلى بياناتكم الشخصية وطلب نسخة منها</li>
                                            <li>تصحيح أي بيانات غير دقيقة</li>
                                            <li>طلب حذف بياناتكم الشخصية</li>
                                            <li>الاعتراض على معالجة بياناتكم</li>
                                            <li>سحب موافقتكم في أي وقت</li>
                                        </ul>
                                    </section>

                                    <section className="legal-section">
                                        <h2>مشاركة المعلومات</h2>
                                        <p>لا نبيع أو نؤجر بياناتكم الشخصية لأطراف ثالثة. قد نشارك المعلومات فقط مع مقدمي الخدمات الموثوقين الذين يساعدوننا في تشغيل أعمالنا، وذلك بموجب اتفاقيات سرية صارمة.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>تواصل معنا</h2>
                                        <p>لأي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا:</p>
                                        <div className="legal-contact">
                                            <p><strong>البريد الإلكتروني:</strong> info@alzamiliah.com</p>
                                            <p><strong>الهاتف:</strong> 920031404</p>
                                            <p><strong>العنوان:</strong> المملكة العربية السعودية، الرياض، حي الصحافة</p>
                                        </div>
                                    </section>
                                </>
                            ) : (
                                <>
                                    <section className="legal-section">
                                        <h2>Introduction</h2>
                                        <p>Welcome to Alzamiliah Investment & Real Estate Development Company. We are committed to protecting your privacy and personal data. This policy explains how we collect, use, and protect your information when you use our website and services.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Information We Collect</h2>
                                        <div className="legal-list">
                                            <div className="legal-list-item">
                                                <div className="legal-list-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                </div>
                                                <div>
                                                    <h3>Personal Information</h3>
                                                    <p>Full name, email address, phone number, and address when you register or contact us.</p>
                                                </div>
                                            </div>
                                            <div className="legal-list-item">
                                                <div className="legal-list-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                                                </div>
                                                <div>
                                                    <h3>Browsing Data</h3>
                                                    <p>IP address, browser type, pages visited, and visit duration to improve user experience.</p>
                                                </div>
                                            </div>
                                            <div className="legal-list-item">
                                                <div className="legal-list-icon">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                </div>
                                                <div>
                                                    <h3>Real Estate Data</h3>
                                                    <p>Property search preferences, inquiries submitted, and transaction history.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="legal-section">
                                        <h2>How We Use Your Information</h2>
                                        <ul>
                                            <li>Providing and improving our real estate services</li>
                                            <li>Communicating with you regarding inquiries and offers</li>
                                            <li>Sending updates about new projects (with your consent)</li>
                                            <li>Analyzing website usage to improve performance</li>
                                            <li>Complying with legal and regulatory requirements in Saudi Arabia</li>
                                        </ul>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Data Protection</h2>
                                        <p>We implement appropriate technical and organizational security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. These measures include data encryption, firewalls, and access controls.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Cookies</h2>
                                        <p>Our website uses cookies to enhance the browsing experience. You can control cookie settings through your browser, noting that disabling them may affect some website functionality.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Your Rights</h2>
                                        <ul>
                                            <li>Access your personal data and request a copy</li>
                                            <li>Correct any inaccurate data</li>
                                            <li>Request deletion of your personal data</li>
                                            <li>Object to the processing of your data</li>
                                            <li>Withdraw your consent at any time</li>
                                        </ul>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Information Sharing</h2>
                                        <p>We do not sell or rent your personal data to third parties. We may share information only with trusted service providers who assist us in operating our business, subject to strict confidentiality agreements.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Contact Us</h2>
                                        <p>For any inquiries about this Privacy Policy, please contact us:</p>
                                        <div className="legal-contact">
                                            <p><strong>Email:</strong> info@alzamiliah.com</p>
                                            <p><strong>Phone:</strong> 920031404</p>
                                            <p><strong>Address:</strong> Saudi Arabia, Riyadh, Al Sahafa District</p>
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
