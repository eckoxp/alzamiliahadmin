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
    createdAt: string;
}

export default function ApartmentsPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/projects')
            .then(r => r.json())
            .then(d => {
                setProjects(d.projects || d || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>
                    {isRTL ? 'أدارة الشقق والمباني' : 'Apartments & Buildings'}
                </h1>
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                        // Add apartment button - could link to a general add form
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isRTL ? 'إضافة مشروع جديد' : 'Add New Project'}
                </button>
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
                                    <td style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : '-'}
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="sort-input"
                                            defaultValue={project.sortOrder}
                                            readOnly
                                        />
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <Link href={`/${locale}/admin/apartments/${project.id}`} className="admin-btn-icon" title={isRTL ? 'تعديل الشقق' : 'Edit Apartments'}>
                                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
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
