import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

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
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
