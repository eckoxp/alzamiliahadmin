'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Chart from 'chart.js/auto';

interface Stats {
    projects_count: number;
    contact_count: number;
    total_visitors: number;
    inquiries_count: number;
    monthly_stats?: {
        list_visitors: number[];
        list_visitors_sa: number[];
    };
}

export default function AdminDashboardPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [stats, setStats] = useState<Stats | null>(null);
    const [failed, setFailed] = useState(false);
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(res => {
                if (!res.ok) throw new Error('Dashboard data could not be loaded');
                return res.json();
            })
            .then(data => setStats(data))
            .catch(() => setFailed(true));
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
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: isRTL ? 'جميع الزوار' : 'All Visitors',
                        data: stats.monthly_stats.list_visitors,
                        borderColor: '#c9a227',
                        backgroundColor: 'rgba(201, 162, 39, 0.1)',
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

    const statCards = [
        { label: isRTL ? 'عدد المشاريع' : 'Projects', value: stats?.projects_count, color: '#c9a227' },
        { label: isRTL ? 'طلبات التواصل' : 'Contact Requests', value: stats?.contact_count, color: '#3b82f6' },
        { label: isRTL ? 'استفسارات الوحدات' : 'Unit Inquiries', value: stats?.inquiries_count, color: '#10b981' },
        { label: isRTL ? 'إجمالي الزوار (2026)' : 'Total Visitors (2026)', value: stats?.total_visitors, color: '#8b5cf6' },
    ];

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
            {failed && <p role="alert">{isRTL ? 'تعذّر تحميل الإحصائيات.' : 'Statistics could not be loaded.'}</p>}

            {/* Stats Grid */}
            <div className="admin-stats-grid">
                {statCards.map((card, i) => (
                    <div key={i} className="admin-stat-card" style={{ borderColor: card.color }}>
                        <div className="label">{card.label}</div>
                        <div className="value">{card.value ?? '-'}</div>
                    </div>
                ))}
            </div>

            {/* Visitors Chart */}
            <div className="admin-card">
                <h2>
                    {isRTL ? '📊 إحصائيات الزوار - 2026' : '📊 Visitor Statistics - 2026'}
                </h2>
                <div className="alz-chart"><canvas ref={chartRef} /></div>
            </div>
        </div>
    );
}
