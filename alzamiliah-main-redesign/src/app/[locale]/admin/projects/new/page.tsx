"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/admin/RichTextEditor"),
  { ssr: false },
);
const MapPicker = dynamic(() => import("@/components/admin/MapPicker"), {
  ssr: false,
});

const PROJECT_TYPES = [
  "فلل",
  "أدوار",
  "شقق",
  "عمائر",
  "سكني",
  "تجاري",
  "مكتبي",
  "مخطط أراضي",
  "مستودعات",
  "كمباوند",
  "كمباوند سكني",
  "كمباوند سكني تجاري",
  "مجمع سكني",
  "مجمع سكني تجاري",
  "مجمع تجاري",
];
const CITIES = [
  "جدة",
  "الرياض",
  "مكة المكرمة",
  "المدينة المنورة",
  "الدمام",
  "الخبر",
  "الظهران",
  "الطائف",
  "تبوك",
  "بريدة",
  "حائل",
  "خميس مشيط",
  "أبها",
  "نجران",
  "جازان",
  "ينبع",
  "الأحساء",
  "القطيف",
  "الجبيل",
  "حفر الباطن",
  "المذنب",
  "القنفذة",
  "ظهران الجنوب",
  "عرعر",
  "سكاكا",
  "الباحة",
  "بيشة",
  "المجمعة",
  "شقراء",
  "الخرج",
  "الزلفي",
  "الدوادمي",
  "عنيزة",
  "الرس",
  "رفحاء",
];

export default function NewProjectPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    livePreview: "",
    descriptionAr: "",
    descriptionEn: "",
    city: "",
    status: "",
    statusApartment: "",
    availability: "1",
    address: "",
    // Guarantees (number of years)
    elec: 0,
    devices: 0,
    elevator: 0,
    air: 0,
    plumber: 0,
    house: 0,
    highQuality: 0,
    smartEntry: 0,
    fireSensor: 0,
    // Links
    icon3d: "",
    iconFollow: "",
    // Map
    lat: 24.7136,
    lng: 46.6753,
    // Sidebar fields
    type: "",
    linkProject: "",
    linkMap: "",
    excerptAr: "",
    excerptEn: "",
    buildYear: "",
    sqFit: "",
    buildingsCount: 0,
    unitsCount: 0,
    elevatorsCount: 0,
    isFeatured: 0,
    sortOrder: 0,
     sheetUrl: "",
    sheetTabName: "",
  });

  // Image uploads (6 slots)
  const [images, setImages] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  // Gallery images
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  // File uploads
  const [files, setFiles] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (fieldName: string, file: File) => {
    setUploading(fieldName);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        setImages((prev) => ({ ...prev, [fieldName]: d.url }));
      }
    } catch {
      /* ignore */
    }
    setUploading(null);
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        setFiles((prev) => ({ ...prev, [fieldName]: d.url }));
      }
    } catch {
      /* ignore */
    }
  };

  const handleGalleryUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        setGalleryImages((prev) => [...prev, d.url]);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...form,
      city: form.city,
      image: images.image || "",
      image2: images.image2 || "",
      image3: images.image3 || "",
      image4: images.image4 || "",
      image5: images.image5 || "",
      image6: images.image6 || "",
            projectFileTitleAr: "",
      projectFileTitleEn: "",
      projectFile2TitleAr: "",
      projectFile2TitleEn: "",
      projectFile3TitleAr: "",
      projectFile3TitleEn: "",
      video: files.video || "",
      galleryImages,
      buildingsCount: parseInt(String(form.buildingsCount)) || 0,
      unitsCount: parseInt(String(form.unitsCount)) || 0,
      elevatorsCount: parseInt(String(form.elevatorsCount)) || 0,
      status: parseInt(String(form.status)) || 0,
      statusApartment: parseInt(String(form.statusApartment)) || 0,
      availability: parseInt(String(form.availability)) || 1,
      isFeatured: parseInt(String(form.isFeatured)) || 0,
      sortOrder: parseInt(String(form?.sortOrder)) || 0,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push(`/${locale}/admin/projects`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create project");
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="admin-page-title">
        {isRTL ? "إضافة مشروع جديد" : "Add New Project"}
      </h1>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="admin-form-layout">
          {/* ====== MAIN CONTENT AREA ====== */}
          <div className="admin-form-main">
            {/* Basic Info Section */}
            <div className="admin-section">
              <h3>{isRTL ? "إضافة مشروع جديد" : "Add New Project"}</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>{isRTL ? "الاسم بالعربي" : "Name (Arabic)"} *</label>
                  <input
                    type="text"
                    dir="rtl"
                    required
                    value={form.nameAr}
                    onChange={(e) => updateField("nameAr", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label>
                    {isRTL ? "الاسم بالانجليزي" : "Name (English)"} *
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    required
                    value={form.nameEn}
                    onChange={(e) => updateField("nameEn", e.target.value)}
                  />
                </div>
                <div className="admin-field full-width">
                  <label>
                    {isRTL ? "رابط البث المباشر" : "Live Preview URL"}{" "}
                    <span className="optional">
                      ({isRTL ? "إختياري" : "optional"})
                    </span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="https://my.tikee.io/videos/..."
                    value={form.livePreview}
                    onChange={(e) => updateField("livePreview", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Description AR */}
            <div className="admin-section">
              <h3>{isRTL ? "المحتوى بالعربي" : "Content (Arabic)"}</h3>
              <RichTextEditor
                content={form.descriptionAr}
                onChange={(val) => updateField("descriptionAr", val)}
                dir="rtl"
              />
            </div>

            {/* Description EN */}
            <div className="admin-section">
              <h3>{isRTL ? "المحتوى بالانجليزي" : "Content (English)"}</h3>
              <RichTextEditor
                content={form.descriptionEn}
                onChange={(val) => updateField("descriptionEn", val)}
                dir="ltr"
              />
            </div>

            {/* City & Status Section */}
            <div className="admin-section">
              <h3>{isRTL ? "المدينة والحالة" : "City & Status"}</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>{isRTL ? "المدينة" : "City"}</label>
                  <select
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  >
                    <option value="">
                      {isRTL ? "اختر المدينة" : "Select city"}
                    </option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>{isRTL ? "حالة العقار" : "Property Status"}</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField("status", e.target.value)}
                  >
                    <option value="">...</option>
                    <option value="0">{isRTL ? "مُباع" : "Sold"}</option>
                    <option value="1">
                      {isRTL ? "تحت الإنشاء" : "Under Construction"}
                    </option>
                    <option value="3">
                      {isRTL ? "متاح للبيع" : "Available"}
                    </option>
                    <option value="4">{isRTL ? "قريبا" : "Coming Soon"}</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>{isRTL ? "حالة المشروع" : "Project Status"}</label>
                  <select
                    value={form.statusApartment}
                    onChange={(e) =>
                      updateField("statusApartment", e.target.value)
                    }
                  >
                    <option value="">...</option>
                    <option value="1">
                      {isRTL ? "بيع بعد الانتهاء" : "Sale After Completion"}
                    </option>
                    <option value="2">
                      {isRTL ? "بيع على الخريطة" : "Off-Plan Sale"}
                    </option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>{isRTL ? "عرض المشروع" : "Visibility"}</label>
                  <select
                    value={form.availability}
                    onChange={(e) =>
                      updateField("availability", e.target.value)
                    }
                  >
                    <option value="">...</option>
                    <option value="1">{isRTL ? "متاح" : "Visible"}</option>
                    <option value="0">{isRTL ? "مخفي" : "Hidden"}</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>{isRTL ? "الموقع" : "Address"}</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Guarantees Section */}
            <div className="admin-section">
              <h3>{isRTL ? "الميزات والضمانات" : "Features & Guarantees"}</h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "12px",
                  marginTop: "-8px",
                }}
              >
                {isRTL
                  ? "أدخل عدد سنوات الضمان لكل ميزة"
                  : "Enter number of warranty years for each feature"}
              </p>
              <div className="admin-guarantee-grid">
                {[
                  {
                    key: "elec",
                    labelAr: "ضمان كهربا",
                    labelEn: "Electrical Warranty",
                  },
                  {
                    key: "devices",
                    labelAr: "ضمان اضاءه",
                    labelEn: "Lighting Warranty",
                  },
                  {
                    key: "elevator",
                    labelAr: "ضمان مصاعد",
                    labelEn: "Elevator Warranty",
                  },
                  {
                    key: "air",
                    labelAr: "تبريد وتكيف",
                    labelEn: "AC & Cooling",
                  },
                  { key: "plumber", labelAr: "صرف صحي", labelEn: "Plumbing" },
                  {
                    key: "house",
                    labelAr: "ضمان على البناء",
                    labelEn: "Building Warranty",
                  },
                  {
                    key: "highQuality",
                    labelAr: "عوازل صوت عالية الجودة",
                    labelEn: "Sound Insulation",
                  },
                  {
                    key: "smartEntry",
                    labelAr: "دخول ذكي",
                    labelEn: "Smart Entry",
                  },
                  {
                    key: "fireSensor",
                    labelAr: "نظام استشعار الحرائق",
                    labelEn: "Fire Sensor System",
                  },
                ].map((g) => (
                  <div key={g.key} className="admin-guarantee-field">
                    <label>{isRTL ? g.labelAr : g.labelEn}</label>
                    <input
                      type="number"
                      min="0"
                      value={form[g.key as keyof typeof form] as number}
                      onChange={(e) =>
                        updateField(g.key, parseInt(e.target.value) || 0)
                      }
                      placeholder={isRTL ? "عدد السنوات" : "Years"}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3D & Follow Links */}
            <div className="admin-section">
              <h3>{isRTL ? "روابط إضافية" : "Additional Links"}</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>{isRTL ? "ثلاثي الأبعاد" : "3D View"}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.icon3d}
                    onChange={(e) => updateField("icon3d", e.target.value)}
                  />
                </div>
                <div className="admin-field">
                  <label>
                    {isRTL ? "متابعة مراحل البناء" : "Construction Progress"}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.iconFollow}
                    onChange={(e) => updateField("iconFollow", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="admin-section">
              <h3>{isRTL ? "الموقع على الخريطة" : "Location on Map"}</h3>
              <div className="admin-form-grid" style={{ marginBottom: "12px" }}>
                <div className="admin-field">
                  <label>{isRTL ? "خط العرض" : "Latitude"}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.lat}
                    onChange={(e) =>
                      updateField("lat", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="admin-field">
                  <label>{isRTL ? "خط الطول" : "Longitude"}</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={form.lng}
                    onChange={(e) =>
                      updateField("lng", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <MapPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => {
                  updateField("lat", lat);
                  updateField("lng", lng);
                }}
              />
            </div>
          </div>

          {/* ====== SIDEBAR ====== */}
          <div className="admin-form-sidebar">
            {/* Project Type & Links */}
            <div className="admin-section">
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>{isRTL ? "نوع المشروع" : "Project Type"}</label>
                <select
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                >
                  <option value="">...</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>{isRTL ? "الرابط الموقع" : "Website URL"}</label>
                <input
                  type="text"
                  dir="ltr"
                  value={form.linkProject}
                  onChange={(e) => updateField("linkProject", e.target.value)}
                />
              </div>
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>{isRTL ? "الرابط الخريطة" : "Map URL"}</label>
                <input
                  type="text"
                  dir="ltr"
                  value={form.linkMap}
                  onChange={(e) => updateField("linkMap", e.target.value)}
                />
              </div>
            </div>

            {/* Excerpts */}
            <div className="admin-section">
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>
                  {isRTL ? "نبذة مختصرة بالعربي" : "Arabic Excerpt"}
                </label>
                <textarea
                  rows={4}
                  dir="rtl"
                  value={form.excerptAr}
                  onChange={(e) => updateField("excerptAr", e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>
                  {isRTL ? "نبذة مختصرة بالانجليزي" : "English Excerpt"}
                </label>
                <textarea
                  rows={4}
                  dir="ltr"
                  value={form.excerptEn}
                  onChange={(e) => updateField("excerptEn", e.target.value)}
                />
              </div>
            </div>

            <div className="admin-section">
              <h3>{isRTL ? "صورة المشروع" : "Project Image"}</h3>
              <div className="admin-upload-slot">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleImageUpload("image", e.target.files[0])
                  }
                />
                {uploading === "image" && (
                  <span style={{ fontSize: "12px", color: "#bc8664" }}>
                    ⏳ {isRTL ? "جاري الرفع..." : "Uploading..."}
                  </span>
                )}
                {images.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images.image} alt="Project" />
                )}
              </div>
            </div>

            {/* Gallery */}
            <div className="admin-section">
              <h3>
                {isRTL ? "معرض الصور" : "Photo Gallery"}{" "}
                <span
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    fontWeight: 400,
                  }}
                >
                  ({galleryImages.length}/5)
                </span>
              </h3>
              <div className="admin-gallery-grid">
                {galleryImages.map((url, i) => (
                  <div key={i} className="admin-gallery-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" />
                    <button
                      type="button"
                      className="admin-gallery-delete"
                      onClick={() =>
                        setGalleryImages((prev) =>
                          prev.filter((_, j) => j !== i),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {galleryImages.length < 5 && (
                <div style={{ marginTop: "8px" }}>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9ca3af",
                      marginBottom: "6px",
                    }}
                  >
                    {isRTL
                      ? `يمكنك إضافة ${5 - galleryImages.length} صور أخرى`
                      : `You can add ${5 - galleryImages.length} more images`}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files)
                          .slice(0, 5 - galleryImages.length)
                          .forEach((f) => handleGalleryUpload(f));
                      }
                    }}
                    style={{ fontSize: "12px" }}
                  />
                </div>
              )}
            </div>

            {/* Numeric Fields */}
            <div className="admin-section">
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>{isRTL ? "سنة الإنشاء" : "Build Year"}</label>
                <input
                  type="number"
                  value={form.buildYear}
                  onChange={(e) => updateField("buildYear", e.target.value)}
                />
              </div>
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>
                  {isRTL ? "مساحة المشروع" : "Project Area (sq ft)"}
                </label>
                <input
                  type="number"
                  value={form.sqFit}
                  onChange={(e) => updateField("sqFit", e.target.value)}
                />
              </div>
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>{isRTL ? "عدد المباني" : "Buildings Count"}</label>
                <input
                  type="number"
                  value={form.buildingsCount}
                  onChange={(e) =>
                    updateField("buildingsCount", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>{isRTL ? "عدد الوحدات" : "Units Count"}</label>
                <input
                  type="number"
                  value={form.unitsCount}
                  onChange={(e) =>
                    updateField("unitsCount", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="admin-field" style={{ marginBottom: "12px" }}>
                <label>{isRTL ? "عدد المصاعد" : "Elevators Count"}</label>
                <input
                  type="number"
                  value={form.elevatorsCount}
                  onChange={(e) =>
                    updateField("elevatorsCount", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="admin-field">
                <label>
                  {isRTL ? "اعرض في الصفحة الرئيسية" : "Show on Homepage"}
                </label>
                <select
                  value={form.isFeatured}
                  onChange={(e) =>
                    updateField("isFeatured", parseInt(e.target.value))
                  }
                >
                  <option value="0">{isRTL ? "لا" : "No"}</option>
                  <option value="1">{isRTL ? "نعم" : "Yes"}</option>
                </select>
              </div>
            </div>
            <div className="admin-field" style={{ marginBottom: "12px" }}>
              <label>{isRTL ? "الترتيب" : "Sort Order"}</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  updateField("sortOrder", parseInt(e.target.value) || 0)
                }
              />
            </div>
            {/* File Uploads */}
            <div className="admin-section">
              <h3>{isRTL ? "ملفات المشروع" : "Project Files"}</h3>
               {[
                {
                  key: "projectFile",
                  labelAr: "ملف المشروع",
                  labelEn: "Project File",
                  titleArKey: "projectFileTitleAr",
                  titleEnKey: "projectFileTitleEn",
                },
                {
                  key: "projectFile2",
                  labelAr: "ملف المشروع 2",
                  labelEn: "Project File 2",
                  titleArKey: "projectFile2TitleAr",
                  titleEnKey: "projectFile2TitleEn",
                },
                {
                  key: "projectFile3",
                  labelAr: "ملف المشروع 3",
                  labelEn: "Project File 3",
                  titleArKey: "projectFile3TitleAr",
                  titleEnKey: "projectFile3TitleEn",
                },
                {
                  key: "video",
                  labelAr: "فديو للمشروع",
                  labelEn: "Project Video",
                },
              ].map((f) => (
                <div
                  key={f.key}
                  className="admin-field"
                  style={{ marginBottom: "12px" }}
                >
                  <label>
                    {isRTL ? f.labelAr : f.labelEn}{" "}
                    <span className="optional">
                      ({isRTL ? "إختياري" : "optional"})
                    </span>
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleFileUpload(f.key, e.target.files[0])
                    }
                    style={{ padding: "6px" }}
                  />
                     {files[f.key] && (
                    <span style={{ fontSize: "11px", color: "#059669" }}>
                      ✓ {isRTL ? "تم الرفع" : "Uploaded"}
                    </span>
                  )}
                  {f.titleArKey && f.titleEnKey && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      <input
                        type="text"
                        placeholder={isRTL ? "العنوان (عربي)" : "Title (Arabic)"}
                        value={(form as any)[f.titleArKey] || ""}
                        onChange={(e) => updateField(f.titleArKey!, e.target.value)}
                        style={{ flex: 1, fontSize: "12px" }}
                      />
                      <input
                        type="text"
                        placeholder={isRTL ? "العنوان (إنجليزي)" : "Title (English)"}
                        value={(form as any)[f.titleEnKey] || ""}
                        onChange={(e) => updateField(f.titleEnKey!, e.target.value)}
                        style={{ flex: 1, fontSize: "12px" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "20px",
          }}
        >
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={saving}
            style={{ padding: "10px 32px", fontSize: "14px" }}
          >
            {saving
              ? isRTL
                ? "جاري الحفظ..."
                : "Saving..."
              : isRTL
                ? "إضافة"
                : "Add Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
