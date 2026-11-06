import prisma from '@/lib/prisma';

const TIMEZONE = 'Asia/Riyadh';
const TOP_PROJECTS = 10;
const TOP_COUNTRIES = 10;

type DateRange = { start: Date; end: Date };

function riyadhYearMonth() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(new Date());
    const year = Number(parts.find(p => p.type === 'year')!.value);
    const month = Number(parts.find(p => p.type === 'month')!.value); // 1-12
    return { year, month };
}

// الصفحات العامة (من غير صفحات المشاريع) مرتبة بعدد المشاهدات
async function topPages(range?: DateRange) {
    const rows = await prisma.pageView.groupBy({
        by: ['path'],
        where: {
            projectId: null,
            ...(range ? { viewDate: { gte: range.start, lt: range.end } } : {}),
        },
        _count: { _all: true },
    });
    return rows
        .map(r => ({ path: r.path, count: r._count._all }))
        .sort((a, b) => b.count - a.count);
}

// مشاهدات كل مشروع (الأسماء بتتضاف بعد كده)
async function projectViews(range?: DateRange) {
    const rows = await prisma.pageView.groupBy({
        by: ['projectId'],
        where: {
            projectId: { not: null },
            ...(range ? { viewDate: { gte: range.start, lt: range.end } } : {}),
        },
        _count: { _all: true },
    });
    return rows.flatMap(r =>
        r.projectId === null ? [] : [{ projectId: r.projectId, count: r._count._all }]
    );
}

// الزوار حسب الدولة (country = null معناها غير معروف)
async function topCountries(range?: DateRange) {
    const rows = await prisma.visitor.groupBy({
        by: ['country'],
        where: range ? { visitDate: { gte: range.start, lt: range.end } } : undefined,
        _count: { _all: true },
    });
    return rows
        .map(r => ({ country: r.country, count: r._count._all }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_COUNTRIES);
}

export async function getDashboardStats() {
    const { year, month } = riyadhYearMonth();
    const start = `${year}-01-01`;
    const end = `${year + 1}-01-01`;
    const monthRange: DateRange = {
        start: new Date(Date.UTC(year, month - 1, 1)),
        end: new Date(Date.UTC(year, month, 1)),
    };

    const [
        projectsCount, contactCount, totalVisitors, saudiVisitors, rows,
        pagesAll, pagesMonth, projectsAll, projectsMonth, countriesAll, countriesMonth,
    ] = await Promise.all([
        prisma.project.count(),
        prisma.contactRequest.count(),
        prisma.visitor.count(),
        prisma.visitor.count({ where: { country: 'SA' } }),
        prisma.$queryRaw<{ month: number; total: bigint; sa: bigint }[]>`
            SELECT EXTRACT(MONTH FROM visit_date)::int AS month,
                   COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE country = 'SA') AS sa
            FROM visitors
            WHERE visit_date >= ${start}::date AND visit_date < ${end}::date
            GROUP BY 1
        `,
        topPages(),
        topPages(monthRange),
        projectViews(),
        projectViews(monthRange),
        topCountries(),
        topCountries(monthRange),
    ]);

    const listVisitors: number[] = Array(12).fill(0);
    const listVisitorsSa: number[] = Array(12).fill(0);
    for (const r of rows) {
        listVisitors[r.month - 1] = Number(r.total);
        listVisitorsSa[r.month - 1] = Number(r.sa);
    }

    // أسماء المشاريع: المشروع المحذوف بيختفي من القائمة تلقائيًا
    const projectIds = Array.from(new Set([...projectsAll, ...projectsMonth].map(r => r.projectId)));
    const projects = projectIds.length
        ? await prisma.project.findMany({
              where: { id: { in: projectIds } },
              select: { id: true, nameAr: true, nameEn: true },
          })
        : [];
    const byId = new Map(projects.map(p => [p.id, p]));

    const withNames = (list: { projectId: number; count: number }[]) =>
        list
            .filter(r => byId.has(r.projectId))
            .sort((a, b) => b.count - a.count)
            .slice(0, TOP_PROJECTS)
            .map(r => {
                const p = byId.get(r.projectId)!;
                return { id: r.projectId, name_ar: p.nameAr, name_en: p.nameEn || p.nameAr, count: r.count };
            });

    return {
        projects_count: projectsCount,
        contact_count: contactCount,
        inquiries_count: 0,
        total_visitors: totalVisitors,
        saudi_visitors: saudiVisitors,
        current_month_visitors: listVisitors[month - 1],
        year,
        monthly_stats: {
            list_visitors: listVisitors,
            list_visitors_sa: listVisitorsSa,
        },
        top_pages: { all: pagesAll, month: pagesMonth },
        top_projects: { all: withNames(projectsAll), month: withNames(projectsMonth) },
        top_countries: { all: countriesAll, month: countriesMonth },
    };
}