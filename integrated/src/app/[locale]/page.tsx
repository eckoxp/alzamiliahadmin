import { setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/ProjectCard';
import prisma from '@/lib/prisma';

export default async function HomePage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const isRTL = locale === 'ar';

    // Fetch featured projects from Neon database
    const projects = await prisma.project.findMany({
        where: {
            status: { in: [1, 2, 3] },
            isFeatured: 1,
        },
        orderBy: { sortOrder: 'asc' },
        take: 4,
    });

    const stats = [
        { number: '16+', labelAr: 'سنة استثمار وتطوير', labelEn: 'Years of investment and development', icon: '/images/calendar1.png' },
        { number: '45+', labelAr: 'مشروع مكتمل', labelEn: 'Complete projects', icon: '/images/calendar1.png' },
        { number: '450+', labelAr: 'وحدة سكنية', labelEn: 'Residential unit', icon: '/images/calendar1.png' },
        { number: '270+', labelAr: 'آلاف متر مربع تم تطويرها', labelEn: 'Thousands of square meters developed', icon: '/images/calendar1.png' },
    ];

    return (
        <>
            <Header />

            <main>
                {/* Hero Section with Video */}
                <section className="hero-section">
                    <video
                        className="hero-video"
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster="/images/hero-poster.jpg"
                    >
                        <source src="/media/FINAL_RENDER2.mp4" type="video/mp4" />
                    </video>
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1>
                            {isRTL ? 'الاستثمار والتطوير العقاري' : 'Real estate investment and development'}
                        </h1>
                    </div>
                </section>

                {/* About Section - Matches Original */}
                <section className="section about-section">
                    <div className="container">
                        <div className="about-grid">
                            {/* Left - Content */}
                            <div className="about-content">
                                <span className="about-label">
                                    {isRTL ? 'حول الزاملية' : 'ABOUT ALZAMILIAH'}
                                    <Image src="/images/logo.png" alt="" width={16} height={16} className="about-label-icon" />
                                </span>
                                <h2 className="about-title">
                                    {isRTL
                                        ? 'الريادة في تحويل الأفكار إلى واقع والرمال إلى بنيان'
                                        : 'Leadership in transforming ideas into reality and sand into structure'}
                                </h2>
                                <p className="about-text">
                                    {isRTL
                                        ? 'بعزيمة تنضح بالابتكار، وبمعادلة ترسم ملامح المستقبل، تأسست شركة الزاملية للاستثمار على أسس صلبة من الخبرة العميقة والتقنية المتقدمة، لتحويل الرؤى إلى واقع يبهر العالم. نحن محرك فعال للتطوير الحضري، نسعى للتميز في كل تفاصيل مشاريعنا، يتبعها فريق إبداعي يحمل روح الابتكار والتميز. نبني بأيدي الخبراء ونضع معايير جديدة للجودة والأناقة، لإرضاء عملائنا وغرس ثقتهم فينا، دفعة ودفعة وإبداعاً تلو إبداع.'
                                        : 'With a determination that exudes innovation, and with a formula that draws the features of the future, Al-Zamilia Investment Company was established on solid foundations of deep experience and advanced technology, to transform visions into a reality that dazzles the world. We are an effective engine for urban development, striving for excellence in every detail of our projects, followed by a creative team carrying the spirit of innovation and excellence. We build with the hands of experts and set new standards for quality and elegance, to satisfy our customers and instil their confidence in us, batch and creativity after batch.'}
                                </p>
                                <a href="https://drive.google.com/file/d/1dsKtndtufVTbD5U_7gnfvN0NgjNt26FQ/view" target="_blank" rel="noopener noreferrer" className="btn-primary">
                                    {isRTL ? 'ملف الشركة' : 'Profile Company'}
                                </a>
                            </div>

                            {/* Right - About Image */}
                            <div className="about-image-box">
                                <Image
                                    src="/images/alzamiliah-about.svg"
                                    alt={isRTL ? 'الزاملية للاستثمار والتطوير العقاري' : 'Alzamiliah Investment & Real Estate Development'}
                                    width={555}
                                    height={400}
                                    className="about-box-svg"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Projects Section */}
                <section className="section projects-section">
                    <div className="container">
                        <span className="section-label">{isRTL ? 'عقارات الزاملية' : 'ALZMAMELIA PROPERTIES'}</span>
                        <h2 className="section-title">
                            {isRTL ? 'المشاريع' : 'Projects'}
                        </h2>

                        <div className="projects-grid projects-grid-3col">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>

                        <div className="text-center mt-40">
                            <a href={`/${locale}/projects`} className="btn-primary">
                                {isRTL ? 'تحميل المزيد' : 'Load More'}
                            </a>
                        </div>
                    </div>
                </section>

                {/* Experience Section - Dark with Background Image */}
                <section className="experience-section">
                    <div className="experience-overlay"></div>
                    <div className="container experience-content">
                        <h2 className="experience-title">
                            {isRTL ? 'خبرة ممتدة في المشاريع المتجددة' : 'Extended experience in renewable projects'}
                        </h2>

                        <div className="stats-row">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-item">
                                    <div className="stat-number-wrapper">
                                        <span className="stat-number">{stat.number}</span>
                                    </div>
                                    <div className="stat-label">{isRTL ? stat.labelAr : stat.labelEn}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact Section with Left Image */}
                <section className="section contact-section-home">
                    <div className="container">
                        <div className="contact-home-grid">
                            {/* Left - Image */}
                            <div className="contact-image-wrapper">
                                <Image
                                    src="/images/city_contact3.jpeg"
                                    alt="Contact"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>

                            {/* Right - Form */}
                            <div className="contact-form-wrapper">
                                <h3 className="contact-form-title">{isRTL ? 'تواصل' : 'Contact'}</h3>
                                <form className="contact-form-home">
                                    <input
                                        type="text"
                                        placeholder={isRTL ? 'الاسم' : 'Name'}
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                                        required
                                    />
                                    <input
                                        type="tel"
                                        placeholder={isRTL ? 'الهاتف' : 'Phone'}
                                    />
                                    <textarea
                                        placeholder={isRTL ? 'الرسالة' : 'Message'}
                                        rows={4}
                                        required
                                    ></textarea>
                                    <button type="submit" className="btn-primary">
                                        {isRTL ? 'إرسال' : 'Send'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
