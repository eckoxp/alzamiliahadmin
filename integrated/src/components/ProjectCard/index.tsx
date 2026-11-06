'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';

interface ProjectCardProps {
    project: {
        id: number;
        nameAr: string;
        nameEn: string | null;
        image: string | null;
        locationAr: string | null;
        locationEn: string | null;
        buildingsCount: number | null;
        unitsCount: number | null;
        status: number;
        linkMap?: string | null;
    };
}

const statusConfig: Record<number, { labelAr: string; labelEn: string; color: string }> = {
    0: { labelAr: 'مباع', labelEn: 'Sold out', color: 'red' },
    1: { labelAr: 'تحت الإنشاء', labelEn: 'Under Construction', color: '#BC8664' },
    3: { labelAr: 'متاح للبيع', labelEn: 'For Sale', color: 'green' },
    4: { labelAr: 'قريباً', labelEn: 'Coming Soon', color: '#f39c12' },
};

export default function ProjectCard({ project }: ProjectCardProps) {
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const name = isRTL ? project.nameAr : (project.nameEn || project.nameAr);
    const statusInfo = statusConfig[project.status] || statusConfig[3];
    const statusLabel = isRTL ? statusInfo.labelAr : statusInfo.labelEn;

    // Handle image path
    const imageSrc = project.image
        ? (project.image.startsWith('http') ? project.image : (project.image.startsWith('/') ? project.image : `/${project.image}`))
        : '/images/logo.png';

    const detailsUrl = `/${locale}/projects/${project.id}`;
    const addressUrl = project.linkMap || '#';

    const handleContactClick = () => {
        // Open WhatsApp with the project name
        const projectName = isRTL ? project.nameAr : (project.nameEn || project.nameAr);
        const message = isRTL
            ? `مرحبا، أود الاستفسار عن مشروع ${projectName}`
            : `Hello, I would like to inquire about ${projectName}`;
        window.open(`https://api.whatsapp.com/send/?phone=966920031404&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`, '_blank');
    };

    return (
        <div className="project-card">
            <div className="project-card-image">
                {/* Status Ribbon */}
                <div className="project-ribbon" style={{ background: statusInfo.color }}>
                    {statusLabel}
                </div>
                {/* Image */}
                <Link href={detailsUrl}>
                    <div className="project-card-gradient"></div>
                    <Image
                        src={imageSrc}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                    />
                </Link>
            </div>
            <div className="project-card-content">
                <h2>
                    <Link href={detailsUrl}>{name}</Link>
                </h2>
                {/* 3 Action Buttons */}
                <div className="project-card-actions">
                    <Link href={detailsUrl} className="project-action-btn">
                        {isRTL ? 'التفاصيل' : 'Details'}
                    </Link>
                    <a
                        href={addressUrl}
                        target={addressUrl !== '#' ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="project-action-btn project-action-address"
                        onClick={(e) => {
                            if (addressUrl === '#') {
                                e.preventDefault();
                            }
                        }}
                    >
                        {isRTL ? 'العنوان' : 'Address'}
                        <img src="https://alzamiliah.com/images/logo/pin_3177361.png" alt="" width={13} height={13} />
                    </a>
                    <button
                        className="project-action-btn"
                        onClick={handleContactClick}
                        style={{ border: '1px solid #ddd', background: 'transparent', cursor: 'pointer' }}
                    >
                        {isRTL ? 'تواصل معنا' : 'Contact Us'}
                    </button>
                </div>
            </div>
        </div>
    );
}
