'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

interface Project {
    id: number;
    nameAr: string;
    nameEn: string | null;
    type: string | null;
    image: string | null;
    buildingsCount: number | null;
    unitsCount: number | null;
    sortOrder: number;
    status: number;
    createdAt: string;
}

export default function ProjectsListPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            setProjects(data.projects || data || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { loadProjects(); }, []);

    const deleteProject = async (id: number) => {
        if (!confirm(isRTL ? 'هل انت متأكد من حذف هذا العنصر ؟' : 'Are you sure you want to delete?')) return;
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        loadProjects();
    };

    const changeSort = async (id: number, value: number) => {
        await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: value }),
        });
    };

    const getStatusBadge = (status: number) => {
        const statuses: Record<number, { label: string; labelEn: string; cls: string }> = {
            0: { label: 'مُباع', labelEn: 'Sold', cls: 'admin-badge-red' },
            1: { label: 'تحت الإنشاء', labelEn: 'Under Construction', cls: 'admin-badge-yellow' },
            3: { label: 'متاح للبيع', labelEn: 'Available', cls: 'admin-badge-green' },
            4: { label: 'قريبا', labelEn: 'Coming Soon', cls: 'admin-badge-blue' },
        };
        const s = statuses[status] || { label: '-', labelEn: '-', cls: 'admin-badge-gray' };
        return <span className={`admin-badge ${s.cls}`}>{isRTL ? s.label : s.labelEn}</span>;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>
                    {isRTL ? 'إدارة المشاريع' : 'Manage Projects'}
                </h1>
                <Link href={`/${locale}/admin/projects/new`} className="admin-btn admin-btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isRTL ? 'إضافة مشروع جديد' : 'Add New Project'}
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading...</div>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{isRTL ? 'الصورة' : 'Image'}</th>
                                <th>{isRTL ? 'الاسم' : 'Name'}</th>
                                <th>{isRTL ? 'نوع المشروع' : 'Type'}</th>
                                <th>{isRTL ? 'مباني' : 'Buildings'}</th>
                                <th>{isRTL ? 'وحدات' : 'Units'}</th>
                                <th>{isRTL ? 'الحالة' : 'Status'}</th>
                                <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                                <th>{isRTL ? 'الترتيب' : 'Order'}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(project => (
                                <tr key={project.id}>
                                    <td>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            className="row-thumb"
                                            src={project.image || '/images/logo.png'}
                                            alt=""
                                            onError={e => { (e.target as HTMLImageElement).src = '/images/logo.png'; }}
                                        />
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{isRTL ? project.nameAr : (project.nameEn || project.nameAr)}</td>
                                    <td>{project.type || '-'}</td>
                                    <td>{project.buildingsCount || '-'}</td>
                                    <td>{project.unitsCount || '-'}</td>
                                    <td>{getStatusBadge(project.status)}</td>
                                    <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : '-'}
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="sort-input"
                                            defaultValue={project.sortOrder}
                                            onChange={e => changeSort(project.id, parseInt(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Link href={`/${locale}/admin/projects/${project.id}/edit`} className="admin-btn-icon" title={isRTL ? 'تعديل' : 'Edit'}>
                                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button onClick={() => deleteProject(project.id)} className="admin-btn-icon danger" title={isRTL ? 'حذف' : 'Delete'}>
                                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
