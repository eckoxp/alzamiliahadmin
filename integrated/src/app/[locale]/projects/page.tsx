'use client';

import { useLocale } from 'next-intl';
import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/ProjectCard';

interface Project {
    id: number;
    nameAr: string;
    nameEn: string | null;
    image: string | null;
    locationAr: string | null;
    locationEn: string | null;
    buildingsCount: number | null;
    unitsCount: number | null;
    status: number;
    statusApartment: number;
    city: string | null;
    lat: number | null;
    lng: number | null;
    type: string | null;
    linkMap: string | null;
}

// Property Status options (from original site data-status attribute)
const propertyStatusOptions = {
    en: [
        { value: '3', label: 'For Sale' },
        { value: '1', label: 'Under Construction' },
        { value: '0', label: 'Sold out' },
        { value: '4', label: 'Coming Soon' },
    ],
    ar: [
        { value: '3', label: 'للبيع' },
        { value: '1', label: 'تحت الإنشاء' },
        { value: '0', label: 'مباع' },
        { value: '4', label: 'قريبا' },
    ],
};

// Property Type options (from original site data-type attribute)
const propertyTypeOptions = {
    en: [
        { value: 'شقق', label: 'Apartments' },
        { value: 'فلل', label: 'Villas' },
        { value: 'دور', label: 'Floor' },
        { value: 'سكني تجاري', label: 'Residential Commercial' },
        { value: 'كمباوند', label: 'Compound' },
        { value: 'كمباوند سكني تجاري', label: 'Residential and commercial compound' },
        { value: 'كمباوند سكني', label: 'Residential compound' },
    ],
    ar: [
        { value: 'شقق', label: 'شقق' },
        { value: 'فلل', label: 'فلل' },
        { value: 'دور', label: 'دور' },
        { value: 'سكني تجاري', label: 'سكني تجاري' },
        { value: 'كمباوند', label: 'كمباوند' },
        { value: 'كمباوند سكني تجاري', label: 'كمباوند سكني تجاري' },
        { value: 'كمباوند سكني', label: 'كمباوند سكني' },
    ],
};

// Project State options (from original site data-status_apartment attribute)
const projectStateOptions = {
    en: [
        { value: '1', label: 'Sell ​​after completion' },
        { value: '2', label: 'Sell ​​on map' },
    ],
    ar: [
        { value: '1', label: 'بيع بعد الانتهاء' },
        { value: '2', label: 'بيع على الخريطة' },
    ],
};

// City options (from original site)
const cityOptions = {
    en: [
        { value: 'جدة', label: 'Jeddah' },
        { value: 'الرياض', label: 'Riyadh' },
        { value: 'الطائف', label: 'Taif' },
    ],
    ar: [
        { value: 'جدة', label: 'جدة' },
        { value: 'الرياض', label: 'الرياض' },
        { value: 'الطائف', label: 'الطائف' },
    ],
};

// Custom dropdown component matching the original site's style
function FilterDropdown({ label, options, value, onChange }: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedLabel = value === 'all'
        ? label
        : options.find(o => o.value === value)?.label || label;

    return (
        <div className="filter-dropdown" ref={ref}>
            <div
                className="filter-dropdown-trigger"
                onClick={() => setOpen(!open)}
            >
                <span className={value === 'all' ? 'placeholder' : 'selected'}>{selectedLabel}</span>
                <span className="caret">▾</span>
            </div>
            {open && (
                <ul className="filter-dropdown-menu">
                    <li
                        className={value === 'all' ? 'active' : ''}
                        onClick={() => { onChange('all'); setOpen(false); }}
                    >
                        {label}
                    </li>
                    {options.map(opt => (
                        <li
                            key={opt.value}
                            className={value === opt.value ? 'active' : ''}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function ProjectsPage() {
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const lang = isRTL ? 'ar' : 'en';
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [cityFilter, setCityFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [stateFilter, setStateFilter] = useState<string>('all');

    useEffect(() => {
        fetch('/api/public/projects')
            .then(res => res.json())
            .then(data => {
                setProjects(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Filter projects — matching the original site's JS filter logic
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (cityFilter !== 'all' && p.city !== cityFilter) return false;
            if (typeFilter !== 'all' && p.type !== typeFilter) return false;
            if (statusFilter !== 'all' && p.status !== Number(statusFilter)) return false;
            // Project state filter uses statusApartment field
            if (stateFilter !== 'all' && p.statusApartment !== Number(stateFilter)) return false;
            return true;
        });
    }, [projects, cityFilter, typeFilter, statusFilter, stateFilter]);

    const handleSearch = () => {
        // Filters already applied reactively — this just triggers visual feedback
    };

    return (
        <>
            <Header forceWhite />

            <main style={{ paddingTop: '77px' }}>
                {/* Map Section */}
                <section className="projects-map-section">
                    <iframe
                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d463879.0066508347!2d46.54232!3d24.7136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e2f03890d489399%3A0xba974d1c98e79fd5!2sRiyadh!5e0!3m2!1s${locale}!2ssa!4v1700000000000!5m2!1s${locale}!2ssa`}
                        width="100%"
                        height="350"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </section>

                {/* Filter Bar */}
                <section className="projects-filter-bar">
                    <div className="container">
                        <div className="filter-bar-inner">
                            {/* Search Icon */}
                            <div className="filter-search-icon" onClick={handleSearch}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>

                            {/* Project State Filter */}
                            <FilterDropdown
                                label={isRTL ? 'حالة المشروع' : 'Project state'}
                                options={projectStateOptions[lang]}
                                value={stateFilter}
                                onChange={setStateFilter}
                            />

                            {/* Property Status Filter */}
                            <FilterDropdown
                                label={isRTL ? 'حالة العقار' : 'Property Status'}
                                options={propertyStatusOptions[lang]}
                                value={statusFilter}
                                onChange={setStatusFilter}
                            />

                            {/* Property Type Filter */}
                            <FilterDropdown
                                label={isRTL ? 'نوع العقار' : 'Property Type'}
                                options={propertyTypeOptions[lang]}
                                value={typeFilter}
                                onChange={setTypeFilter}
                            />

                            {/* City Filter */}
                            <FilterDropdown
                                label={isRTL ? 'المدينة' : 'city'}
                                options={cityOptions[lang]}
                                value={cityFilter}
                                onChange={setCityFilter}
                            />
                        </div>
                    </div>
                </section>

                {/* Projects Grid */}
                <section className="section bg-light">
                    <div className="container">
                        {loading ? (
                            <p className="text-center" style={{ color: 'var(--color-text-light)', padding: '40px' }}>
                                {isRTL ? 'جاري التحميل...' : 'Loading...'}
                            </p>
                        ) : (
                            <>
                                <div className="projects-grid projects-grid-3col">
                                    {filteredProjects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>

                                {filteredProjects.length === 0 && (
                                    <p className="text-center" style={{ color: 'var(--color-text-light)', padding: '40px' }}>
                                        {isRTL ? 'لا توجد مشاريع حالياً' : 'No projects available'}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
