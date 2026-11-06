export const revalidate = 0;
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import prisma from "@/lib/prisma";
import StatsBar from "./StatsBar";
import ContactForm from '@/components/Contact/ContactForm';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isRTL = locale === "ar";

  // Fetch featured projects from Neon database
  const projects = await prisma.project.findMany({
    where: {
      isFeatured: 1,
    },
    orderBy: { sortOrder: "asc" },
    take: 6,
  });

  const stats = [
    {
      number: "16",
      labelAr: "عاماً من الاستثمار والتطوير",
      labelEn: "Years of Investment & Development",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
        </svg>
      ),
    },
    {
      number: "45",
      labelAr: "مشروع منجز",
      labelEn: "Completed Projects",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      ),
    },
    {
      number: "450",
      labelAr: "وحدة سكنية تم بناءها",
      labelEn: "Residential Units Built",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M1 11l11-9 11 9v11H15v-6H9v6H1z" />
        </svg>
      ),
    },
    {
      number: "270",
      labelAr: "الف متر مربع أمتار مطورة",
      labelEn: "Thousand sqm Developed",
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
        </svg>
      ),
    },
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
            // poster="/images/hero-poster.jpg"
          >
            <source src="/media/FINAL_RENDER2.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1>
              {isRTL
                ? "الاستثمار والتطوير العقاري"
                : "Real estate investment and development"}
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
                  {isRTL ? "حول الزاملية" : "ABOUT ALZAMILIAH"}
                  <Image
                    src="/images/logo.png"
                    alt=""
                    width={16}
                    height={16}
                    className="about-label-icon"
                  />
                </span>
                <h2 className="about-title">
                  {isRTL
                    ? "الريادة في تحويل الأفكار إلى واقع والرمال إلى بنيان"
                    : "Leadership in transforming ideas into reality and sand into structure"}
                </h2>
                <p className="about-text">
                  {isRTL
                    ? "بعزيمة تنضح بالابتكار، وبمعادلة ترسم ملامح المستقبل، تأسست شركة الزاملية للاستثمار على أسس صلبة من الخبرة العميقة والتقنية المتقدمة، لتحويل الرؤى إلى واقع يبهر العالم. نحن محرك فعال للتطوير الحضري، نسعى للتميز في كل تفاصيل مشاريعنا، يتبعها فريق إبداعي يحمل روح الابتكار والتميز. نبني بأيدي الخبراء ونضع معايير جديدة للجودة والأناقة، لإرضاء عملائنا وغرس ثقتهم فينا، دفعة ودفعة وإبداعاً تلو إبداع."
                    : "With a determination that exudes innovation, and with a formula that draws the features of the future, Al-Zamilia Investment Company was established on solid foundations of deep experience and advanced technology, to transform visions into a reality that dazzles the world. We are an effective engine for urban development, striving for excellence in every detail of our projects, followed by a creative team carrying the spirit of innovation and excellence. We build with the hands of experts and set new standards for quality and elegance, to satisfy our customers and instil their confidence in us, batch and creativity after batch."}
                </p>
                <a
                  href="https://drive.google.com/file/d/1dsKtndtufVTbD5U_7gnfvN0NgjNt26FQ/view"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {isRTL ? "ملف الشركة" : "Profile Company"}
                </a>
              </div>

              {/* Right - About Image */}
              <div className="about-image-box">
                <Image
                  src="/images/alzamiliah-about.svg"
                  alt={
                    isRTL
                      ? "الزاملية للاستثمار والتطوير العقاري"
                      : "Alzamiliah Investment & Real Estate Development"
                  }
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
            <span className="section-label">
              {isRTL ? "عقارات الزاملية" : "ALZMAMELIA PROPERTIES"}
            </span>
            <h2 className="section-title">{isRTL ? "المشاريع" : "Projects"}</h2>

            <div className="projects-grid projects-grid-3col">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            <div className="text-center mt-40">
              <a href={`/${locale}/projects`} className="btn-primary">
                {isRTL ? "تحميل المزيد" : "Load More"}
              </a>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="experience-section">
          <div className="experience-overlay"></div>
          <div className="experience-content">
            <h2 className="experience-title">
              {isRTL
                ? "خبرة ممتدة ومشاريع متجددة"
                : "Extended Experience & Renewed Projects"}
            </h2>
          </div>
        </section>

        <StatsBar isRTL={isRTL} />
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
                  style={{ objectFit: "cover" }}
                />
              </div>

              {/* Right - Form */}
              <div className="contact-form-wrapper">
                <h3 className="contact-form-title">
                  {isRTL ? "تواصل معنا" : "Contact"}
                </h3>
                <p>
                  يرغب خبراؤنا ومطورونا في المساهمة بخبراتهم وأفكارهم ومساعدتك
                  اليوم
                </p>
                <ContactForm isRTL={isRTL} />

              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
