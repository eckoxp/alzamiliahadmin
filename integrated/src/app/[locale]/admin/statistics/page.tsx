'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import Chart from 'chart.js/auto';

interface Stats {
    total_visitors: number;
    saudi_visitors: number;
    monthly_stats: {
        list_visitors: number[];
        list_visitors_sa: number[];
    };
}

export default function StatisticsPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [stats, setStats] = useState<Stats | null>(null);
    const monthlyRef = useRef<HTMLCanvasElement>(null);
    const compRef = useRef<HTMLCanvasElement>(null);
    const charts = useRef<Chart[]>([]);

    const months = isRTL
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(r => r.json())
            .then(d => setStats(d))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!stats?.monthly_stats) return;

        charts.current.forEach(c => c.destroy());
        charts.current = [];

        if (monthlyRef.current) {
            charts.current.push(new Chart(monthlyRef.current, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [{
                        label: isRTL ? 'الزوار' : 'Visitors',
                        data: stats.monthly_stats.list_visitors,
                        backgroundColor: 'rgba(201, 162, 39, 0.8)',
                        borderRadius: 4,
                    }],
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                },
            }));
        }

        if (compRef.current) {
            charts.current.push(new Chart(compRef.current, {
                type: 'doughnut',
                data: {
                    labels: [isRTL ? 'زوار السعودية' : 'Saudi Visitors', isRTL ? 'زوار آخرين' : 'Other Visitors'],
                    datasets: [{
                        data: [stats.saudi_visitors, stats.total_visitors - stats.saudi_visitors],
                        backgroundColor: ['#10b981', '#c9a227'],
                    }],
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } },
                },
            }));
        }

        return () => {
            charts.current.forEach(c => c.destroy());
            charts.current = [];
        };
    }, [stats, isRTL, months]);

    const currentMonth = new Date().getMonth();

    return (
        <div>
            <h1 className="admin-page-title">{isRTL ? 'إحصائيات الموقع' : 'Site Statistics'}</h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {[
                    {
                        icon: '👥', labelAr: 'إجمالي الزوار', labelEn: 'Total Visitors',
                        value: stats?.total_visitors?.toLocaleString() || '-',
                        bg: '#f3e8ff', iconBg: '#ede9fe', color: '#7c3aed',
                    },
                    {
                        icon: '🇸🇦', labelAr: 'زوار السعودية', labelEn: 'Saudi Visitors',
                        value: stats?.saudi_visitors?.toLocaleString() || '-',
                        bg: '#d1fae5', iconBg: '#a7f3d0', color: '#059669',
                    },
                    {
                        icon: '📊', labelAr: 'هذا الشهر', labelEn: 'This Month',
                        value: stats?.monthly_stats?.list_visitors[currentMonth]?.toLocaleString() || '-',
                        bg: '#dbeafe', iconBg: '#bfdbfe', color: '#2563eb',
                    },
                ].map((card, i) => (
                    <div key={i} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                            {card.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#6b7280' }}>{isRTL ? card.labelAr : card.labelEn}</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                <div className="admin-card">
                    <h2>{isRTL ? 'الزوار الشهريين' : 'Monthly Visitors'}</h2>
                    <canvas ref={monthlyRef} height="200" />
                </div>
                <div className="admin-card">
                    <h2>{isRTL ? 'مقارنة الزوار' : 'Visitor Comparison'}</h2>
                    <canvas ref={compRef} height="200" />
                </div>
            </div>

            {/* Monthly Data Table */}
            <div className="admin-card">
                <h2>{isRTL ? 'بيانات الزوار الشهرية - 2026' : 'Monthly Visitor Data - 2026'}</h2>
                <div className="admin-table-wrap" style={{ boxShadow: 'none' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{isRTL ? 'الشهر' : 'Month'}</th>
                                <th>{isRTL ? 'جميع الزوار' : 'All Visitors'}</th>
                                <th>{isRTL ? 'زوار السعودية' : 'Saudi Visitors'}</th>
                                <th>{isRTL ? 'النسبة' : 'Percentage'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {months.map((month, i) => {
                                const total = stats?.monthly_stats?.list_visitors[i] || 0;
                                const saudi = stats?.monthly_stats?.list_visitors_sa[i] || 0;
                                const pct = total > 0 ? ((saudi / total) * 100).toFixed(1) : '0';
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{month}</td>
                                        <td>{total.toLocaleString()}</td>
                                        <td>{saudi.toLocaleString()}</td>
                                        <td>{pct}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
