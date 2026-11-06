'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useState, useEffect } from 'react';

interface HeaderProps {
    forceWhite?: boolean;
}

export default function Header({ forceWhite = false }: HeaderProps) {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [isScrolled, setIsScrolled] = useState(forceWhite);

    useEffect(() => {
        if (forceWhite) {
            setIsScrolled(true);
            return;
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [forceWhite]);

    const navItems = isRTL ? [
        { href: `/${locale}`, label: 'الرئيسية' },
        { href: `/${locale}/about`, label: 'حول الشركة' },
        { href: `/${locale}/projects`, label: 'مشاريعنا' },
        { href: '#', label: 'المدونة', disabled: true },
        { href: `/${locale}/contact`, label: 'تواصل معنا' },
    ] : [
        { href: `/${locale}`, label: 'Homepage' },
        { href: `/${locale}/about`, label: 'About Us' },
        { href: `/${locale}/projects`, label: 'Projects' },
        { href: '#', label: 'Blog', disabled: true },
        { href: `/${locale}/contact`, label: 'Contact Us' },
    ];

    return (
        <header className={`header-wrapper${isScrolled ? ' header-scrolled' : ''}`}>
            <div className="container">
                <div className="header-inside">
                    {/* Navigation */}
                    <nav className="header-nav">
                        <ul>
                            {navItems.map((item, index) => (
                                <li key={index}>
                                    {item.disabled ? (
                                        <span
                                            onClick={() => alert(isRTL ? 'تحت الإنشاء' : 'Coming Soon')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {item.label}
                                        </span>
                                    ) : (
                                        <Link href={item.href}>{item.label}</Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Centered Logo */}
                    <div className="header-logo">
                        <Link href={`/${locale}`}>
                            <Image
                                src={isScrolled ? "/images/logo.png" : "/images/logow.png"}
                                alt="Alzamiliah"
                                width={120}
                                height={55}
                                priority
                            />
                        </Link>
                    </div>

                    {/* Actions: Phone & Language */}
                    <div className="header-actions">
                        {/* Language Switcher */}
                        <div className="language-switch">
                            <Link href={isRTL ? '/en' : '/ar'}>
                                <Image
                                    src="/images/language.png"
                                    alt={isRTL ? 'English' : 'العربية'}
                                    width={28}
                                    height={28}
                                />
                            </Link>
                        </div>

                        {/* Phone */}
                        <div className="header-phone">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 295.64 369.54" width="18" height="18">
                                <path fill="currentColor" d="M231.99 189.12c18.12,10.07 36.25,20.14 54.37,30.21 7.8,4.33 11.22,13.52 8.15,21.9 -15.59,42.59 -61.25,65.07 -104.21,49.39 -87.97,-32.11 -153.18,-97.32 -185.29,-185.29 -15.68,-42.96 6.8,-88.62 49.39,-104.21 8.38,-3.07 17.57,0.35 21.91,8.15 10.06,18.12 20.13,36.25 30.2,54.37 4.72,8.5 3.61,18.59 -2.85,25.85 -8.46,9.52 -16.92,19.04 -25.38,28.55 18.06,43.98 55.33,81.25 99.31,99.31 9.51,-8.46 19.03,-16.92 28.55,-25.38 7.27,-6.46 17.35,-7.57 25.85,-2.85z" />
                            </svg>
                            <a href="https://api.whatsapp.com/send/?phone=966920031404&text&type=phone_number&app_absent=0">
                                920031404
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button className="mobile-menu-btn" aria-label="Menu">
                            <i className="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
