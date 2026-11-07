'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { Users, MapPin, ChartNoAxesColumn } from 'lucide-react';
import Chart from 'chart.js/auto';
import 'flag-icons/css/flag-icons.min.css';

interface PageStat { path: string; count: number }
interface ProjectStat { id: number; name_ar: string; name_en: string; count: number }
interface CountryStat { country: string | null; count: number }
interface ByRange<T> { all: T[]; month: T[] }

interface Stats {
    total_visitors: number;
    saudi_visitors: number;
    current_month_visitors: number;
    year: number;
    monthly_stats: {
        list_visitors: number[];
        list_visitors_sa: number[];
    };
    top_pages?: ByRange<PageStat>;
    top_projects?: ByRange<ProjectStat>;
    top_countries?: ByRange<CountryStat>;
}

type Range = 'all' | 'month';

// أسماء الصفحات العامة بدل المسارات
const PAGE_NAMES: Record<string, { ar: string; en: string }> = {
    '/': { ar: 'الرئيسية', en: 'Home' },
    '/about': { ar: 'من نحن', en: 'About' },
    '/contact': { ar: 'تواصل معنا', en: 'Contact' },
    '/projects': { ar: 'المشاريع', en: 'Projects' },
    '/qrcode': { ar: 'رمز QR', en: 'QR Code' },
    '/privacy': { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
    '/terms': { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
};

const RANK_COLORS = [
    { bg: '#bc8664', fg: '#ffffff' }, // 1
    { bg: '#9ca3af', fg: '#ffffff' }, // 2
    { bg: '#b45309', fg: '#ffffff' }, // 3
];

function RankBadge({ rank, size = 26 }: { rank: number; size?: number }) {
    const c = RANK_COLORS[rank - 1] ?? { bg: '#f3f4f6', fg: '#6b7280' };
    return (
        <span
            style={{
                width: size, height: size, borderRadius: '50%', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: c.bg, color: c.fg, fontSize: size <= 24 ? 12 : 13, fontWeight: 700,
            }}
        >
            {rank}
        </span>
    );
}

interface RankedItem { key: string; label: string; count: number }

// قائمة مرتبة بشرائط نسبية (بديل الرسم القديم: بتدعم العربي والأسماء الطويلة وما بتعملش وميض مع التحديث اللحظي)
function RankedList({ items, colors, isRTL }: { items: RankedItem[]; colors: [string, string]; isRTL: boolean }) {
    const max = Math.max(...items.map(i => i.count), 1);
    const dir = isRTL ? 'left' : 'right';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item, i) => (
                <div key={item.key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <RankBadge rank={i + 1} />
                        <div style={{ flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937', overflowWrap: 'anywhere' }}>
                            {item.label}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '999px', padding: '3px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1f2937' }}>{item.count.toLocaleString()}</span>
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{isRTL ? 'زيارة' : 'visits'}</span>
                        </div>
                    </div>
                    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${Math.max(4, (item.count / max) * 100)}%`,
                                height: '100%',
                                borderRadius: '999px',
                                background: `linear-gradient(to ${dir}, ${colors[0]}, ${colors[1]})`,
                                transition: 'width 0.4s ease',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// علم الدولة كصورة SVG من حزمة flag-icons (الإيموجي مابتظهرش على ويندوز)
function Flag({ code }: { code: string | null }) {
    const box = { width: 30, height: 22, borderRadius: 4, flexShrink: 0 } as const;
    if (!code || code.length !== 2) {
        return (
            <span style={{ ...box, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontSize: 13 }}>
                🌍
            </span>
        );
    }
    return (
        <span
            className={`fi fi-${code.toLowerCase()}`}
            style={{ ...box, boxShadow: '0 0 0 1px rgba(0,0,0,0.12)' }}
        />
    );
}

export default function StatisticsPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [stats, setStats] = useState<Stats | null>(null);
    const [range, setRange] = useState<Range>('all');
    const monthlyRef = useRef<HTMLCanvasElement>(null);
    const compRef = useRef<HTMLCanvasElement>(null);
    const charts = useRef<Chart[]>([]);

    const months = isRTL
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const pages = stats?.top_pages?.[range] ?? [];
    const projects = stats?.top_projects?.[range] ?? [];
    const countries = stats?.top_countries?.[range] ?? [];
    const rangeTotal = range === 'all' ? stats?.total_visitors ?? 0 : stats?.current_month_visitors ?? 0;

    const pageLabel = (path: string) => {
        const n = PAGE_NAMES[path];
        return n ? (isRTL ? n.ar : n.en) : path;
    };

    const countryName = (code: string | null) => {
        if (!code) return isRTL ? 'غير معروف' : 'Unknown';
        try {
            return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
        } catch {
            return code;
        }
    };

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
                        backgroundColor: 'rgba(188, 134, 100, 0.8)',
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
                        backgroundColor: ['#36231f', '#bc8664'],
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

    const rangeButton = (value: Range, labelAr: string, labelEn: string) => (
        <button
            key={value}
            type="button"
            onClick={() => setRange(value)}
            style={{
                padding: '7px 18px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                background: range === value ? '#ffffff' : 'transparent',
                color: range === value ? '#1f2937' : '#6b7280',
                boxShadow: range === value ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.15s ease',
            }}
        >
            {isRTL ? labelAr : labelEn}
        </button>
    );

    const visitsNote = isRTL ? 'الزيارة = زائر فريد في اليوم' : 'A visit = one unique visitor per day';

    const emptyMessage = (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
            {isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}
        </div>
    );

    return (
        <div>
            <h1 className="admin-page-title">{isRTL ? 'إحصائيات الموقع' : 'Site Statistics'}</h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {[
                    {
                        icon: Users, labelAr: 'إجمالي الزوار', labelEn: 'Total Visitors',
                        value: stats?.total_visitors?.toLocaleString() || '-',
                        bg: '#f8eee7', iconBg: '#f0e0d3', color: '#694537',
                    },
                    {
                        icon: MapPin, labelAr: 'زوار السعودية', labelEn: 'Saudi Visitors',
                        value: stats?.saudi_visitors?.toLocaleString() || '-',
                        bg: '#f3e7de', iconBg: '#e8cebc', color: '#694537',
                    },
                    {
                        icon: ChartNoAxesColumn, labelAr: 'هذا الشهر', labelEn: 'This Month',
                        value: stats?.current_month_visitors?.toLocaleString() || '-',
                        bg: '#f2e2d6', iconBg: '#e8cebc', color: '#805641',
                    },
                ].map((card, i) => (
                    <div key={i} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                            <card.icon size={23} strokeWidth={1.6} color={card.color} aria-hidden="true" />
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

            {/* Most visited: pages + projects */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>{isRTL ? 'الأكثر زيارة' : 'Most Visited'}</h2>
                <div style={{ display: 'inline-flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
                    {rangeButton('all', 'كل الأوقات', 'All time')}
                    {rangeButton('month', 'هذا الشهر', 'This month')}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                <div className="admin-card">
                    <h2 style={{ marginBottom: '4px' }}>{isRTL ? 'الصفحات الأكثر زيارة' : 'Most Visited Pages'}</h2>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 18px' }}>{visitsNote}</p>
                    {pages.length > 0 ? (
                        <RankedList
                            items={pages.map(p => ({ key: p.path, label: pageLabel(p.path), count: p.count }))}
                            colors={['#dec0ad', '#bc8664']}
                            isRTL={isRTL}
                        />
                    ) : emptyMessage}
                </div>
                <div className="admin-card">
                    <h2 style={{ marginBottom: '4px' }}>{isRTL ? 'المشاريع الأكثر زيارة' : 'Most Visited Projects'}</h2>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 18px' }}>{visitsNote}</p>
                    {projects.length > 0 ? (
                        <RankedList
                            items={projects.map(p => ({ key: String(p.id), label: isRTL ? p.name_ar : p.name_en, count: p.count }))}
                            colors={['#dec0ad', '#805641']}
                            isRTL={isRTL}
                        />
                    ) : emptyMessage}
                </div>
            </div>

            {/* Monthly Data Table */}
            <div className="admin-card" style={{ marginBottom: '28px' }}>
                <h2>{isRTL ? `بيانات الزوار الشهرية - ${stats?.year ?? ''}` : `Monthly Visitor Data - ${stats?.year ?? ''}`}</h2>
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

            {/* Top Countries Table (آخر الصفحة) */}
            <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0 }}>{isRTL ? 'أكثر الدول زيارة' : 'Top Countries'}</h2>
                    <span style={{ fontSize: '13px', color: '#6b7280', background: '#f3f4f6', borderRadius: '999px', padding: '4px 12px' }}>
                        {range === 'all' ? (isRTL ? 'كل الأوقات' : 'All time') : (isRTL ? 'هذا الشهر' : 'This month')}
                        {' · '}
                        {rangeTotal.toLocaleString()} {isRTL ? 'زائر' : 'visitors'}
                    </span>
                </div>
                {countries.length > 0 ? (
                    <div className="admin-table-wrap" style={{ boxShadow: 'none' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '48px' }}>#</th>
                                    <th>{isRTL ? 'الدولة' : 'Country'}</th>
                                    <th>{isRTL ? 'الزوار' : 'Visitors'}</th>
                                    <th style={{ minWidth: '180px' }}>{isRTL ? 'النسبة' : 'Share'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {countries.map((c, i) => {
                                    const share = rangeTotal > 0 ? (c.count / rangeTotal) * 100 : 0;
                                    const isSaudi = c.country === 'SA';
                                    return (
                                        <tr key={c.country ?? 'unknown'} style={isSaudi ? { background: '#faf1ea' } : undefined}>
                                            <td><RankBadge rank={i + 1} size={24} /></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: '#1f2937' }}>
                                                    <Flag code={c.country} />
                                                    <span>{countryName(c.country)}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: '#1f2937' }}>{c.count.toLocaleString()}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <div
                                                            style={{
                                                                width: `${Math.max(share > 0 ? 3 : 0, share)}%`,
                                                                height: '100%',
                                                                borderRadius: '999px',
                                                                background: isSaudi ? '#36231f' : '#bc8664',
                                                                transition: 'width 0.4s ease',
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{ width: '48px', fontSize: '13px', color: '#6b7280', textAlign: isRTL ? 'left' : 'right' }}>
                                                        {share.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : emptyMessage}
            </div>
        </div>
    );
}