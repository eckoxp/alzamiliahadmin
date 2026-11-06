"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

interface Project {
  id: number;
  nameAr: string;
  nameEn: string | null;
  type: string | null;
  image: string | null;
  buildingsCount: number | null;
  unitsCount: number | null;
  status: number;
  createdAt: string;
}

const statusMap: Record<
  number,
  { label: string; labelEn: string; cls: string }
> = {
  0: { label: "مُباع", labelEn: "Sold", cls: "admin-badge-red" },
  1: {
    label: "تحت الإنشاء",
    labelEn: "Under Construction",
    cls: "admin-badge-yellow",
  },
  3: { label: "متاح للبيع", labelEn: "Available", cls: "admin-badge-green" },
  4: { label: "قريباً", labelEn: "Coming Soon", cls: "admin-badge-blue" },
};

export default function ApartmentsPage() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects || d || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: number) => {
    const s = statusMap[status] || {
      label: "-",
      labelEn: "-",
      cls: "admin-badge-gray",
    };
    return (
      <span className={`admin-badge ${s.cls}`}>
        {isRTL ? s.label : s.labelEn}
      </span>
    );
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>
          {isRTL ? "إدارة الشقق والوحدات" : "Manage Apartments"}
        </h1>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
          Loading...
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isRTL ? "الصورة" : "Image"}</th>
                <th>{isRTL ? "الاسم" : "Name"}</th>
                <th>{isRTL ? "نوع المشروع" : "Type"}</th>
                <th>{isRTL ? "مباني" : "Buildings"}</th>
                <th>{isRTL ? "وحدات" : "Units"}</th>
                <th>{isRTL ? "الحالة" : "Status"}</th>
                <th>{isRTL ? "التاريخ" : "Date"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="row-thumb"
                      src={project.image || "/images/logo.png"}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/logo.png";
                      }}
                    />
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {isRTL ? project.nameAr : project.nameEn || project.nameAr}
                  </td>
                  <td>{project.type || "-"}</td>
                  <td>{project.buildingsCount || "-"}</td>
                  <td>{project.unitsCount || "-"}</td>
                  <td>{getStatusBadge(project.status)}</td>
                  <td style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString(
                          isRTL ? "ar-SA" : "en-US",
                        )
                      : "-"}
                  </td>
                  <td>
                    <Link
                      href={`/${locale}/admin/apartments/${project.id}`}
                      className="admin-btn admin-btn-gold admin-btn-sm"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ width: "15px", height: "15px" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {isRTL ? "إدارة الشقق" : "Manage Apartments"}
                    </Link>
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