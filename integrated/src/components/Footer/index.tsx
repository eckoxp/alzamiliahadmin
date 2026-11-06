'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';

export default function Footer() {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const quickLinks = isRTL ? [
        { href: `/${locale}`, label: 'الرئيسية' },
        { href: `/${locale}/about`, label: 'حول الزاملية' },
        { href: `/${locale}/projects`, label: 'مشاريعنا' },
        { href: `/${locale}/contact`, label: 'تواصل معنا' },
    ] : [
        { href: `/${locale}`, label: 'Home' },
        { href: `/${locale}/about`, label: 'About Alzamiliah' },
        { href: `/${locale}/projects`, label: 'Our Projects' },
        { href: `/${locale}/contact`, label: 'Contact Us' },
    ];

    const socialLinks = [
        {
            href: 'https://www.instagram.com/alzamiliahCo',
            icon: '/images/instagram.svg',
            label: 'Instagram',
            isImage: true
        },
        {
            href: 'https://api.whatsapp.com/send/?phone=966920031404&text&type=phone_number&app_absent=0',
            icon: 'fab fa-whatsapp',
            label: 'WhatsApp',
            isImage: false
        },
        {
            href: 'https://x.com/alzamiliahco',
            icon: '/images/twitter.svg',
            label: 'Twitter',
            isImage: true
        },
        {
            href: 'https://www.linkedin.com/in/%D8%A7%D9%84%D8%B2%D8%A7%D9%85%D9%84%D9%8A%D8%A9-%D9%84%D9%84%D8%A7%D8%B3%D8%AA%D8%AB%D9%85%D8%A7%D8%B1-7595302b2/',
            icon: 'fab fa-linkedin-in',
            label: 'LinkedIn',
            isImage: false
        },
    ];

    return (
        <footer className="footer">
            <div className="footer-main">
                <div className="footer-grid">
                    {/* About Section */}
                    <div className="footer-widget footer-about">
                        <h4>{isRTL ? 'حول الزاملية' : 'About Alzamiliah'}</h4>
                        <p>
                            {isRTL
                                ? 'نوجه استثماراتنا في الزاملية نحو الفرص التنموية المختلفة متكئين على خبرتنا واضعين المستقبل نُصب أعيننا.'
                                : 'At Alzamiliah, we direct our investments towards various developmental opportunities, relying on our experience and keeping our eyes on the future.'
                            }
                        </p>
                        <Image
                            src="/images/logow.png"
                            alt="Alzamiliah"
                            width={155}
                            height={50}
                        />
                    </div>

                    {/* Quick Links */}
                    <div className="footer-widget footer-links">
                        <h4>{isRTL ? 'روابط سريعة' : 'Quick Links'}</h4>
                        <ul>
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <Link href={link.href}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-widget footer-contact">
                        <h4>{isRTL ? 'تواصل معنا' : 'Contact Us'}</h4>
                        <p>
                            <i className="fas fa-building"></i>
                            <span>
                                {isRTL
                                    ? 'المملكة العربية السعودية، الرياض، حي الصحافة، طريق العليا'
                                    : 'Saudi Arabia, Riyadh, Al Sahafa District, Olaya Road'
                                }
                            </span>
                        </p>
                        <p>
                            <i className="fas fa-phone"></i>
                            <a href="https://api.whatsapp.com/send/?phone=966920031404&text&type=phone_number&app_absent=0">
                                966920031404
                            </a>
                        </p>
                        <p>
                            <i className="far fa-envelope"></i>
                            <a href="mailto:info@alzamiliah.com">info@alzamiliah.com</a>
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="footer-widget">
                        <h4>{isRTL ? 'تابعنا على' : 'Follow Us'}</h4>
                        <div className="footer-social">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                >
                                    {social.isImage ? (
                                        <Image src={social.icon} alt={social.label} width={17} height={17} />
                                    ) : (
                                        <i className={social.icon}></i>
                                    )}
                                </a>
                            ))}
                        </div>
                        <a
                            href="https://drive.google.com/file/d/1dsKtndtufVTbD5U_7gnfvN0NgjNt26FQ/view?usp=drive_link"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="profile-link"
                        >
                            {isRTL ? 'الملف التعريفي' : 'Company Profile'}
                        </a>
                    </div>
                </div>
            </div>

            {/* Sub Footer */}
            <div className="sub-footer">
                <div className="sub-footer-content">
                    <span className="copyright">
                        {isRTL ? 'حقوق النشر. كل الحقوق محفوظة.' : 'Copyright. All Rights Reserved.'}
                    </span>
                    <div className="subfooter-menu">
                        <ul>
                            <li>
                                <Link href={`/${locale}/terms`}>
                                    {isRTL ? 'شروط الاستخدام' : 'Terms of Use'}
                                </Link>
                            </li>
                            <li>
                                <Link href={`/${locale}/privacy`}>
                                    {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}
