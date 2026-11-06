import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
        title: locale === 'ar' ? 'شروط الاستخدام | الزاملية' : 'Terms of Use | Alzamiliah',
        description: locale === 'ar' ? 'شروط وأحكام استخدام موقع شركة الزاملية للاستثمار والتطوير العقاري' : 'Terms and Conditions of Use for Alzamiliah Investment & Real Estate Development',
    };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
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
                            <span>{isRTL ? 'شروط الاستخدام' : 'Terms of Use'}</span>
                        </nav>
                        <h1>{isRTL ? 'شروط الاستخدام' : 'Terms of Use'}</h1>
                        <p className="legal-updated">{isRTL ? 'آخر تحديث: يناير 2025' : 'Last Updated: January 2025'}</p>
                    </div>
                </div>

                <div className="legal-content">
                    <div className="container">
                        <div className="legal-card">
                            {isRTL ? (
                                <>
                                    <section className="legal-section">
                                        <h2>القبول بالشروط</h2>
                                        <p>باستخدامكم لموقع شركة الزاملية للاستثمار والتطوير العقاري، فإنكم توافقون على الالتزام بهذه الشروط والأحكام. إذا كنتم لا توافقون على أي من هذه الشروط، يرجى عدم استخدام الموقع.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>وصف الخدمات</h2>
                                        <p>توفر شركة الزاملية منصة إلكترونية لعرض المشاريع العقارية السكنية والتجارية في المملكة العربية السعودية. تشمل خدماتنا عرض تفاصيل المشاريع، معلومات الوحدات، والتواصل مع فريق المبيعات.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>استخدام الموقع</h2>
                                        <p>تلتزمون باستخدام الموقع للأغراض المشروعة فقط، وتوافقون على عدم:</p>
                                        <ul>
                                            <li>استخدام الموقع بطريقة تخالف القوانين المحلية أو الدولية</li>
                                            <li>نقل أو نشر أي محتوى ضار أو مسيء</li>
                                            <li>محاولة الوصول غير المصرح به إلى أنظمتنا</li>
                                            <li>استخدام المعلومات المتاحة لأغراض تجارية دون إذن</li>
                                            <li>نسخ أو إعادة إنتاج محتوى الموقع دون تصريح كتابي</li>
                                        </ul>
                                    </section>

                                    <section className="legal-section">
                                        <h2>الملكية الفكرية</h2>
                                        <p>جميع المحتويات المعروضة على الموقع، بما في ذلك النصوص والصور والشعارات والتصاميم والرسومات، هي ملكية فكرية لشركة الزاملية أو مرخصة لها. يحظر استخدام أو نسخ أو توزيع أي من هذه المحتويات دون الحصول على إذن كتابي مسبق.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>المعلومات العقارية</h2>
                                        <p>تبذل الشركة جهودها لضمان دقة المعلومات المعروضة عن المشاريع العقارية، بما في ذلك الأسعار والمساحات والمواصفات. ومع ذلك، قد تخضع هذه المعلومات للتغيير دون إشعار مسبق. يُنصح بالتواصل المباشر مع فريق المبيعات للحصول على أحدث المعلومات.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>إخلاء المسؤولية</h2>
                                        <p>يُقدم الموقع ومحتوياته &ldquo;كما هو&rdquo; دون أي ضمانات صريحة أو ضمنية. لا تتحمل الشركة مسؤولية أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام الموقع أو عدم القدرة على استخدامه.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>الروابط الخارجية</h2>
                                        <p>قد يحتوي الموقع على روابط لمواقع خارجية. لا نتحمل مسؤولية محتوى هذه المواقع أو ممارسات الخصوصية الخاصة بها. ننصح بمراجعة سياسات الخصوصية لأي موقع خارجي تزورونه.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>القانون المعمول به</h2>
                                        <p>تخضع هذه الشروط وتُفسر وفقًا لقوانين المملكة العربية السعودية. تختص المحاكم السعودية بالنظر في أي نزاع ينشأ عن استخدام هذا الموقع.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>تعديل الشروط</h2>
                                        <p>تحتفظ الشركة بحقها في تعديل هذه الشروط في أي وقت. سيتم نشر أي تعديلات على هذه الصفحة، ويُعتبر استمراركم في استخدام الموقع بعد نشر التعديلات موافقة منكم عليها.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>تواصل معنا</h2>
                                        <p>لأي استفسارات حول شروط الاستخدام، يرجى التواصل معنا:</p>
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
                                        <h2>Acceptance of Terms</h2>
                                        <p>By using the Alzamiliah Investment & Real Estate Development Company website, you agree to be bound by these terms and conditions. If you do not agree to any of these terms, please do not use the website.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Description of Services</h2>
                                        <p>Alzamiliah provides an online platform for showcasing residential and commercial real estate projects in Saudi Arabia. Our services include displaying project details, unit information, and connecting with our sales team.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Use of the Website</h2>
                                        <p>You agree to use the website for lawful purposes only and agree not to:</p>
                                        <ul>
                                            <li>Use the website in a manner that violates local or international laws</li>
                                            <li>Transmit or publish any harmful or offensive content</li>
                                            <li>Attempt unauthorized access to our systems</li>
                                            <li>Use available information for commercial purposes without permission</li>
                                            <li>Copy or reproduce website content without written authorization</li>
                                        </ul>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Intellectual Property</h2>
                                        <p>All content displayed on the website, including text, images, logos, designs, and graphics, is the intellectual property of Alzamiliah or licensed to it. The use, copying, or distribution of any such content is prohibited without prior written permission.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Real Estate Information</h2>
                                        <p>The company makes every effort to ensure the accuracy of information displayed about real estate projects, including prices, areas, and specifications. However, this information may be subject to change without prior notice. We recommend contacting our sales team directly for the latest information.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Disclaimer</h2>
                                        <p>The website and its contents are provided &ldquo;as is&rdquo; without any express or implied warranties. The company shall not be liable for any direct or indirect damages resulting from the use or inability to use the website.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>External Links</h2>
                                        <p>The website may contain links to external sites. We are not responsible for the content of these sites or their privacy practices. We recommend reviewing the privacy policies of any external site you visit.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Governing Law</h2>
                                        <p>These terms are governed by and interpreted in accordance with the laws of the Kingdom of Saudi Arabia. Saudi courts have jurisdiction over any dispute arising from the use of this website.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Modification of Terms</h2>
                                        <p>The company reserves the right to modify these terms at any time. Any amendments will be posted on this page, and your continued use of the website after posting of amendments constitutes your acceptance of them.</p>
                                    </section>

                                    <section className="legal-section">
                                        <h2>Contact Us</h2>
                                        <p>For any inquiries about these Terms of Use, please contact us:</p>
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
