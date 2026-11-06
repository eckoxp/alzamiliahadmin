import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import PageLoader from '@/components/PageLoader';
import VisitorTracker from '@/components/VisitorTracker';

export const metadata: Metadata = {
    title: "الزاملية للتطوير والاستثمار العقاري | Alzamiliah Real Estate",
    description: "الخدمات العقارية كبيع وشراء الأراضي والعقارات وتطويرها واستثمارها في المملكة العربية السعودية",
    keywords: "عقارات, الرياض, جدة, الزاملية, استثمار عقاري, real estate, saudi arabia",
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);

    const messages = await getMessages();
    const isRTL = locale === "ar";

    return (
        <html lang={locale} dir={isRTL ? "rtl" : "ltr"}>
            <head>

                 {/* Google Tag Manager */}
    <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-5L8RB4CV');`}
    </Script>
    {/* End Google Tag Manager */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
                />
            </head>
            <body className={`antialiased ${isRTL ? "font-cairo" : ""}`}>

                 {/* Google Tag Manager (noscript) */}
    <noscript>
        <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5L8RB4CV"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
        />
    </noscript>
    {/* End Google Tag Manager (noscript) */}

                <NextIntlClientProvider messages={messages}>
                    <PageLoader/>
                    <VisitorTracker />
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
