import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function AboutPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isRTL = locale === 'ar';

    return (
        <>
            <Header forceWhite />

            <main style={{ paddingTop: '77px' }}>
                {/* Map Section - same as projects page */}
                <div className="map-section">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.674826254088!2d46.6884!3d24.7136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDQyJzQ5LjAiTiA0NsKwNDEnMTguMiJF!5e0!3m2!1sen!2ssa!4v1234567890"
                        width="100%"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </div>

                {/* About Us Header */}
                <section style={{ padding: '40px 0 0', textAlign: 'center' }}>
                    <div className="container">
                        <h4 style={{ fontSize: '23px', color: 'var(--color-text-light)', marginBottom: '10px' }}>
                            {isRTL ? 'حول الشركة' : 'About Us'}
                        </h4>
                        <h2 style={{ fontSize: '28px', color: 'var(--color-text)', fontWeight: 600 }}>
                            {isRTL ? 'التطلّع للأفضل، بداية النجاح' : 'Aspiration for the best is the beginning of success'}
                        </h2>
                    </div>
                </section>

                {/* Company Introduction */}
                <section style={{ padding: '30px 0 40px' }}>
                    <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <p style={{
                            textAlign: 'center',
                            lineHeight: 1.9,
                            fontSize: '16px',
                            color: 'var(--color-text)',
                        }}>
                            {isRTL
                                ? 'تأسست الشركة الزاملية للاستثمار عام ( 1429 ه / 2008 م) في مدينة الرياض بالمملكة العربية السعودية، لتبدأ عملها في الخدمات العقارية كبيع وشراء الأراضي والعقارات وتطويرها واستثمارها، وذلك بالإضافة إلى التسويق العقاري للمشاريع والمخططات العقارية.'
                                : 'Al.Zamilia Investment Company was established in (1429 AH / 2008 AD) in the city of Riyadh in the Kingdom of Saudi Arabia, to start its work in real estate services such as buying and selling lands and real estate, developing and investing them, in addition to real estate marketing for projects and real estate schemes. The company also works in various investment fields such as food and general trade. and operating industrial projects.'
                            }
                        </p>
                    </div>
                </section>

                {/* Vision, Mission, Objectives */}
                <section style={{ padding: '0 0 50px' }}>
                    <div className="container">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto' }}>
                            {/* Vision */}
                            <div>
                                <div style={{
                                    background: 'rgba(143, 143, 143, 0.17)',
                                    borderRadius: '4px',
                                    padding: '9px 0',
                                    textAlign: 'center',
                                    width: '50%',
                                    margin: '0 auto 15px',
                                }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                                        {isRTL ? 'الرؤية' : 'Vision'}
                                    </h3>
                                </div>
                                <p style={{ textAlign: 'center', lineHeight: 1.8, color: 'var(--color-text)' }}>
                                    {isRTL
                                        ? 'أن تكون الزاملية للاستثمار شركة رائدة في الاستثمار العقاري في المملكة العربية السعودية، وأن توفر لعملائها خيارات عقارية مميزة وذات جودة عالية، تساهم في رفع مستوى جودة الحياة في المملكة.'
                                        : 'To be a leading company in real estate investment in the Kingdom of Saudi Arabia, and to provide our clients with distinguished and high-quality real estate options that contribute to raising the quality of life in the Kingdom.'
                                    }
                                </p>
                            </div>

                            {/* Mission */}
                            <div>
                                <div style={{
                                    background: 'rgba(143, 143, 143, 0.17)',
                                    borderRadius: '4px',
                                    padding: '9px 0',
                                    textAlign: 'center',
                                    width: '50%',
                                    margin: '0 auto 15px',
                                }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                                        {isRTL ? 'الرسالة' : 'The Message'}
                                    </h3>
                                </div>
                                <p style={{ textAlign: 'center', lineHeight: 1.8, color: 'var(--color-text)' }}>
                                    {isRTL
                                        ? 'تقديم مشاريع عقارية وخدمات متفردة لعملائنا، ودعم تحقيق رغباتهم، من خلال معرفة تطلعاتهم وفهم احتياجاتهم ، والالتزام بالمسؤولية الاجتماعية'
                                        : 'Providing unique real estate projects and services to our clients, supporting the achievement of their desires, through understanding their aspirations and needs, and commitment to social responsibility.'
                                    }
                                </p>
                            </div>

                            {/* Objectives */}
                            <div>
                                <div style={{
                                    background: 'rgba(143, 143, 143, 0.17)',
                                    borderRadius: '4px',
                                    padding: '9px 0',
                                    textAlign: 'center',
                                    width: '50%',
                                    margin: '0 auto 15px',
                                }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                                        {isRTL ? 'الأهداف' : 'Objectives'}
                                    </h3>
                                </div>
                                <p style={{ textAlign: 'center', lineHeight: 1.8, color: 'var(--color-text)' }}>
                                    {isRTL
                                        ? 'ﻫﺪﻓﻨﺎ تحقيق الكفاءة في الأهداف العقارية والاستثمارية. نتطلع إلى أن نكون حجر الأساس في إنشاء وتطوير المشاريع العقارية في المملكة. نؤمن بأن تحقيـق النجاح يعتمد على الشراكة الفعّالة مع عملائنا، ونسعى جاهدين لتقديم خبّراتنا المتميزة في السوق المحلي لدعمهم في تحقيق أهدافهم و رغباتهم. نسعى إلى تحقيق تأثير إيجابي في المشهد العقاري و العمراني في المملكة، حيث نتطلع إلى أن نكون الشركة الرائدة والمرجعية في القطاع العقاري وتطوير المشاريع. عبر مختلف الخبرات سنكون العلامة الفارقة في تقديم أفضل الحلول في شتى المجالات العقارية بما يخدم أهداف ورغبات عملائنا وذلك ضمن رؤية المملكة 2030، ونؤمن بأهمية بناء علاقات قائمة على الثقة والإحترافية مع عملائنا. انطلاقاً من خبّرة واسعة بالسوق المحلي ورغبات العملاء, نحرص على دمج القدرات والكفاءات للوصول إلى منتجات عقارية مميزة.'
                                        : 'Our goal is to achieve efficiency in real estate and investment objectives. We aspire to be the cornerstone in establishing and developing real estate projects in the Kingdom. We believe that achieving success depends on effective partnership with our clients, and we strive to provide our distinguished expertise in the local market to support them in achieving their goals and desires. We seek to make a positive impact on the real estate and urban landscape in the Kingdom, and we aspire to be the leading and reference company in the real estate sector and project development. Through various experiences, we will be the distinguishing mark in providing the best solutions in various real estate fields to serve the goals and desires of our clients within the Kingdom\'s Vision 2030, and we believe in the importance of building relationships based on trust and professionalism with our clients. Based on extensive experience in the local market and customer desires, we are keen to integrate capabilities and competencies to reach distinguished real estate products.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Our Services Header */}
                <section style={{ padding: '20px 0' }}>
                    <div className="container" style={{ textAlign: 'center' }}>
                        <h3 style={{
                            display: 'inline-flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#BC8664',
                            fontSize: '36px',
                            fontWeight: 600,
                            margin: '40px 0',
                            padding: '10px 0',
                            position: 'relative',
                        }}>
                            {isRTL ? 'خدماتنا الزاملية للاستثمار' : 'Our services for investment'}
                        </h3>
                        <div style={{
                            width: '25%',
                            height: '3px',
                            background: '#BC8664',
                            margin: '-30px auto 30px',
                        }} />
                    </div>
                </section>

                {/* Services Grid */}
                <section style={{ padding: '0 0 60px' }}>
                    <div className="container">
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '40px',
                        }} className="about-services-grid">
                            {/* Service 1: Real Estate Development */}
                            <div>
                                <div style={{
                                    background: 'rgba(143, 143, 143, 0.17)',
                                    borderRadius: '4px',
                                    padding: '9px 20px',
                                    textAlign: 'center',
                                    marginBottom: '20px',
                                    width: 'fit-content',
                                    minWidth: '60%',
                                    margin: '0 auto 20px',
                                }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                                        {isRTL ? 'الاستثمار في التطوير العقاري' : 'Investment in Real Estate Development'}
                                    </h3>
                                </div>
                                <div style={{ textAlign: 'center', lineHeight: 1.8, color: 'var(--color-text)', fontSize: '14px' }}>
                                    {isRTL ? (
                                        <>
                                            <p style={{ marginBottom: '8px' }}>1- استكشاف الفرص الاستثمارية: تقوم الشركة الزاملية بدراسة السوق بعمق لتحديد الفرص العقارية المتميزة ويتضمن ذلك تحليل كافة المؤثرات على جودة المشاريع.</p>
                                            <p style={{ marginBottom: '8px' }}>2- الدراسات و التصاميم: تقوم الشركة بإجراء كافة الدراسات التفصيلية لضمان تحقيق مشاريع متميزة و طرح أفكار تصميمية متفردة ومبنية على الاحتياج الحقيقي لعملائنا.</p>
                                            <p style={{ marginBottom: '8px' }}>3- التفاوض و الاستحواذ: التفاوض مع الملاك وأصحاب العقارات و الحرص على إتمام عملية الاستحواذ بأقل التكاليف الممكنة للمشروع, مما يعزز تحقيق أسعار تنافسية لعملائنا.</p>
                                            <p style={{ marginBottom: '8px' }}>4- البناء و التشييد: تقوم الشركة بتنسيق ومتابعة كافة عمليات البناء والتشييد وذلك باستخدام أفضل المواد و الحلول التقنية, مما يساهم في سرعة إنجاز المشاريع في المواعيد المحددة و الحفاظ على أعلى معايير الجودة.</p>
                                            <p>5- التسويق و البيع: تعمل الزاملية على جانب التسويق و المبيعات للمشاريع المنجزة بشكل يضمن عرض المشروع بطرق تسويقية تنافسية وشفافية على عملائنا.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p style={{ marginBottom: '8px' }}>1- Exploring Investment Opportunities: The company studies the market in depth to identify distinguished real estate opportunities, including analysis of all factors affecting project quality.</p>
                                            <p style={{ marginBottom: '8px' }}>2- Studies & Design: The company conducts all detailed studies to ensure distinguished projects and presents unique design ideas based on the real needs of our clients.</p>
                                            <p style={{ marginBottom: '8px' }}>3- Negotiation & Acquisition: Negotiating with owners and property holders, ensuring the acquisition process is completed at the lowest possible cost, enhancing competitive pricing for our clients.</p>
                                            <p style={{ marginBottom: '8px' }}>4- Construction & Building: The company coordinates and follows up on all construction operations using the best materials and technical solutions, contributing to timely project completion while maintaining the highest quality standards.</p>
                                            <p>5- Marketing & Sales: Alzamiliah works on marketing and sales for completed projects in a way that ensures presenting the project through competitive and transparent marketing methods to our clients.</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Service 2: Investing in Promising Sectors */}
                            <div>
                                <div style={{
                                    background: 'rgba(143, 143, 143, 0.17)',
                                    borderRadius: '4px',
                                    padding: '9px 20px',
                                    textAlign: 'center',
                                    width: 'fit-content',
                                    minWidth: '60%',
                                    margin: '0 auto 20px',
                                }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                                        {isRTL ? 'الاستثمار في القطاعات الواعدة' : 'Investing in Promising Sectors'}
                                    </h3>
                                </div>
                                <p style={{ textAlign: 'center', lineHeight: 1.8, color: 'var(--color-text)', fontSize: '14px' }}>
                                    {isRTL
                                        ? 'الزاملية للاستثمار تسعى لتحقيق التميز في مجالات استثمارية ذات تأثير مستدام و مستقبل مزهر, حيث تركز الشركة على تطوير مشاريع واعدة و مبتكرة, مع التركيز على تنويع المنتجات وتبني التكنولوجيا الحديثة في قطاع التقنية, ومن خلال ذلك تسعى الشركة إلى تعزيز الاستثمار في المشاريع التقنية وتطوير المهارات المرتبطة بها.'
                                        : 'Alzamiliah Investment strives to achieve excellence in investment fields with sustainable impact and a prosperous future, where the company focuses on developing promising and innovative projects, with an emphasis on product diversification and adopting modern technology in the technology sector, through which the company seeks to enhance investment in technology projects and develop related skills.'
                                    }
                                </p>
                            </div>

                            {/* Service 3: Investment in Innovation */}
                            <div>
                                <div style={{
                                    background: 'rgba(143, 143, 143, 0.17)',
                                    borderRadius: '4px',
                                    padding: '9px 20px',
                                    textAlign: 'center',
                                    width: 'fit-content',
                                    minWidth: '60%',
                                    margin: '0 auto 20px',
                                }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                                        {isRTL ? 'الاستثمار في الابتكار' : 'Investment in Innovation'}
                                    </h3>
                                </div>
                                <p style={{ textAlign: 'center', lineHeight: 1.8, color: 'var(--color-text)', fontSize: '14px' }}>
                                    {isRTL
                                        ? 'الدعم والاستثمار في الشركات الناشئة والمشاريع الواعدة والتكنولوجيا المبتكرة. تكنولوجيا المعلومات والاتصالات: تحسين استخدام التكنولوجيا في عمليات الأعمال وتحسين التواصل الرقمي. تنمية المهارات التقنية: تطوير القدرات والمهارات في مجال التقنية مثل مجالات التدريب والتعليم.'
                                        : 'Support and investment in startups, promising projects, and innovative technology. Information and Communication Technology: Improving the use of technology in business operations and improving digital communication. Technical skills development: Developing capabilities and skills in the field of technology such as training and education.'
                                    }
                                </p>
                            </div>

                            {/* Service 4: Technology Sector */}
                            <div>
                                <div style={{
                                    background: 'rgba(143, 143, 143, 0.17)',
                                    borderRadius: '4px',
                                    padding: '9px 20px',
                                    textAlign: 'center',
                                    width: 'fit-content',
                                    minWidth: '60%',
                                    margin: '0 auto 20px',
                                }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                                        {isRTL ? 'قطاع التقنية' : 'Technology Sector'}
                                    </h3>
                                </div>
                                <p style={{ textAlign: 'center', lineHeight: 1.8, color: 'var(--color-text)', fontSize: '14px' }}>
                                    {isRTL
                                        ? 'تسعى الشركة إلى التوسع في قطاع التقنية من خلال دعم وتطوير مشاريع تقنية حديثة ومبتكرة، يهدف ذلك إلى تعزيز الاستثمار في هذا القطاع واستخدام التكنولوجيا الحديثة في مختلف المجالات، مما يساهم في تحفيز الابتكار وتعزيز القدرات التنافسية.'
                                        : 'The company seeks to expand in the technology sector through supporting and developing modern and innovative technology projects, aiming to enhance investment in this sector and use modern technology in various fields, which contributes to stimulating innovation and enhancing competitive capabilities.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Counter Bar - matching homepage dark style */}
                <section className="experience-section">
                    <div className="experience-overlay"></div>
                    <div className="container experience-content">
                        <h2 className="experience-title">
                            {isRTL ? 'خبرة ممتدة في المشاريع المتجددة' : 'Extended experience in renewable projects'}
                        </h2>
                        <div className="stats-row">
                            <div className="stat-item">
                                <div className="stat-number-wrapper">
                                    <span className="stat-number">+16</span>
                                </div>
                                <div className="stat-label">{isRTL ? 'سنة استثمار وتطوير' : 'Years of investment and development'}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number-wrapper">
                                    <span className="stat-number">+45</span>
                                </div>
                                <div className="stat-label">{isRTL ? 'مشروع مكتمل' : 'Complete projects'}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number-wrapper">
                                    <span className="stat-number">+450</span>
                                </div>
                                <div className="stat-label">{isRTL ? 'وحدة سكنية' : 'Residential unit'}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number-wrapper">
                                    <span className="stat-number">+270</span>
                                </div>
                                <div className="stat-label">{isRTL ? 'آلاف متر مربع تم تطويرها' : 'Thousands of square meters developed'}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Form Section */}
                <section style={{ padding: '60px 0', background: '#f5f5f5' }}>
                    <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <h3 style={{
                            textAlign: 'center',
                            fontSize: '28px',
                            fontWeight: 600,
                            marginBottom: '30px',
                            color: 'var(--color-text)',
                        }}>
                            {isRTL ? 'تواصل معنا' : 'Get in Touch'}
                        </h3>
                        <form style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <input
                                    type="text"
                                    placeholder={isRTL ? 'الاسم' : 'Name'}
                                    style={{
                                        padding: '12px 15px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        background: '#fff',
                                    }}
                                />
                                <input
                                    type="email"
                                    placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                                    style={{
                                        padding: '12px 15px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        background: '#fff',
                                    }}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder={isRTL ? 'رقم الجوال' : 'Phone Number'}
                                style={{
                                    padding: '12px 15px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    background: '#fff',
                                }}
                            />
                            <textarea
                                placeholder={isRTL ? 'اكتب رسالتك' : 'Write your message'}
                                rows={4}
                                style={{
                                    padding: '12px 15px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    resize: 'vertical',
                                    background: '#fff',
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    background: '#BC8664',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '14px 30px',
                                    borderRadius: '4px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    alignSelf: 'flex-start',
                                    transition: 'background 0.3s',
                                }}
                            >
                                {isRTL ? 'اكتب رسالتك' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
