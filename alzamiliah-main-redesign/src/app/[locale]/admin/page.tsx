'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Building2, Mail, MessageSquare, Users } from 'lucide-react';
import Chart from 'chart.js/auto';

interface Stats {
    projects_count: number;
    contact_count: number;
    total_visitors: number;
    inquiries_count: number;
    year?: number;
    monthly_stats?: {
        list_visitors: number[];
        list_visitors_sa: number[];
    };
}

export default function AdminDashboardPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [stats, setStats] = useState<Stats | null>(null);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        const es = new EventSource('/api/dashboard/stats/stream');
        es.onmessage = (e) => {
            try {
                setStats(JSON.parse(e.data));
            } catch (err) {
                console.error(err);
            }
        };
        // EventSource بيعيد الاتصال لوحده لو انقطع
        return () => es.close();
    }, []);

    useEffect(() => {
        if (!stats?.monthly_stats || !chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const months = isRTL
            ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        chartInstance.current = new Chart(chartRef.current, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: isRTL ? 'زوار السعودية' : 'Saudi Visitors',
                        data: stats.monthly_stats.list_visitors_sa,
                        borderColor: '#36231f',
                        backgroundColor: 'rgba(54, 35, 31, 0.13)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: isRTL ? 'جميع الزوار' : 'All Visitors',
                        data: stats.monthly_stats.list_visitors,
                        borderColor: '#bc8664',
                        backgroundColor: 'rgba(188, 134, 100, 0.16)',
                        fill: true,
                        tension: 0.4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                },
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [stats, isRTL]);

    const year = stats?.year ?? new Date().getFullYear();
    const statCards = [
        { label: isRTL ? 'عدد المشاريع' : 'Projects', value: stats?.projects_count, icon: Building2 },
        { label: isRTL ? 'طلبات التواصل' : 'Contact Requests', value: stats?.contact_count, icon: Mail },
        { label: isRTL ? 'استفسارات الوحدات' : 'Unit Inquiries', value: stats?.inquiries_count, icon: MessageSquare },
        { label: isRTL ? `إجمالي الزوار (${year})` : `Total Visitors (${year})`, value: stats?.total_visitors, icon: Users },
    ];

    const quickLinks = [
        ['/projects', isRTL ? 'إدارة المشاريع' : 'Manage projects'],
        ['/apartments', isRTL ? 'إدارة الشقق والمباني' : 'Apartments & buildings'],
        ['/contacts', isRTL ? 'طلبات التواصل' : 'Contact requests'],
        ['/qrcode-leads', isRTL ? 'طلبات QR Code' : 'QR code leads'],
    ];
    const Arrow = isRTL ? ChevronLeft : ChevronRight;

    return (
        <div>
            <section className="alz-hero">
                <div>
                    <small>{isRTL ? 'الزاملية للتطوير والاستثمار العقاري' : 'Alzamiliah Real Estate'}</small>
                    <h1 className="admin-page-title">{isRTL ? 'لوحة التحكم' : 'Dashboard'}</h1>
                    <p>{isRTL ? 'نظرة عامة على المشاريع وطلبات التواصل وزيارات الموقع.' : 'Projects, contact requests, and site visits at a glance.'}</p>
                </div>
                <Link className="admin-btn admin-btn-primary" href={`/${locale}/admin/projects/new`}>
                    {isRTL ? 'إضافة مشروع جديد' : 'Add New Project'}
                </Link>
            </section>

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                {statCards.map((card, i) => (
                    <div key={i} className="admin-stat-card">
                        <div><div className="label">{card.label}</div>
                        <div className="value">{card.value ?? '-'}</div></div>
                        <span className="alz-stat-icon"><card.icon size={22} strokeWidth={1.6} aria-hidden="true" /></span>
                    </div>
                ))}
            </div>

            <div className="alz-overview-grid">
                <section className="admin-card">
                    <h2>{isRTL ? `إحصائيات الزوار · ${year}` : `Visitor statistics · ${year}`}</h2>
                    <div className="alz-chart"><canvas ref={chartRef} /></div>
                </section>
                <section className="admin-card">
                    <h2>{isRTL ? 'وصول سريع' : 'Quick access'}</h2>
                    <div className="alz-quick-links">
                        {quickLinks.map(([path, label]) => (
                            <Link key={path} href={`/${locale}/admin${path}`}>
                                {label}<Arrow size={15} aria-hidden="true" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}