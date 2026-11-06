"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./unit-form.module.css";

/* ── Types ── */
interface Project {
  id: number;
  nameAr: string;
  nameEn: string | null;
}

interface Apartment {
  id: number;
  unitCode: string | null;
  buildingName: string | null;
  floor: string | null;
  area: number | null;
  buildingArea: number | null;
  roofArea: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  maidBathroom: number | null;
  price: number | null;
  status: string;
  type: string | null;
  image: string | null;
  maidRoom: number | null;
  balcony: number | null;
  parking: number | null;
  storage: number | null;
  laundry: number | null;
  direction: string | null;
  view: string | null;
}

/* ── Empty form state ── */
const emptyForm = (): Omit<Apartment, "id"> => ({
  unitCode: "",
  buildingName: "",
  floor: "",
  area: null,
  buildingArea: null,
  roofArea: null,
  bedrooms: null,
  bathrooms: null,
  maidBathroom: null,
  price: null,
  status: "available",
  type: "شقة",
  image: "",
  maidRoom: 0,
  balcony: 0,
  parking: 0,
  storage: 0,
  laundry: 0,
  direction: "",
  view: "",
});

/* ── Status options ── */
const STATUS_OPTIONS = [
  {
    value: "available",
    labelAr: "متاح",
    labelEn: "Available",
    color: "#059669",
  },
  {
    value: "reserved",
    labelAr: "محجوز",
    labelEn: "Reserved",
    color: "#d97706",
  },
  { value: "sold", labelAr: "مباع", labelEn: "Sold", color: "#dc2626" },
  { value: "محجوب", labelAr: "محجوب", labelEn: "Hidden", color: "#6b7280" },
];

/* ── Numeric room / facility fields (replaces the old on/off toggle buttons) ── */
const ROOM_FIELDS = [
  { key: "bedrooms", labelAr: "غرف النوم", labelEn: "Bedrooms" },
  { key: "bathrooms", labelAr: "غرف الحمام", labelEn: "Bathrooms" },
  {
    key: "maidBathroom",
    labelAr: "حمام الخادمة",
    labelEn: "Maid Bathroom",
  },
  { key: "balcony", labelAr: "شرفة", labelEn: "Balcony" },
  { key: "parking", labelAr: "مواقف سيارات", labelEn: "Parking" },
  { key: "maidRoom", labelAr: "غرفة الخادمة", labelEn: "Maid Room" },
  { key: "storage", labelAr: "مخزن", labelEn: "Storage" },
  { key: "laundry", labelAr: "غرفة غسيل", labelEn: "Laundry" },
] as const;

type RoomFieldKey = (typeof ROOM_FIELDS)[number]["key"];

/* Fields that should default to null (unspecified) instead of 0 when empty */
const NULLABLE_ROOM_FIELDS: RoomFieldKey[] = ["bedrooms", "bathrooms"];

/* ── Generated display title (replaces the old stored nameAr/nameEn) ── */
function unitTitle(
  apt: { type: string | null; unitCode: string | null },
  isRTL: boolean,
): string {
  const type = apt.type || (isRTL ? "وحدة" : "Unit");
  const code = apt.unitCode || "—";
  return `${type} ${code}`;
}

/* ════════════════════════════════════════════ */
export default function ApartmentsDetailPage() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  /* State */
  const [project, setProject] = useState<Project | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Apartment | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [imageError, setImageError] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchUnit, setSearchUnit] = useState("");

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, aptsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          credentials: "include",
        }),
        fetch(`/api/apartments?projectId=${projectId}`),
      ]);

      if (projRes.status === 401) {
        router.push(`/${locale}/admin/login`);
        return;
      }

      if (!projRes.ok) {
        console.error("Failed to fetch project:", projRes.status);
        setLoading(false);
        return;
      }

      const projData = await projRes.json();
      const aptsData = await aptsRes.json();

      // /api/projects/[id] returns the project object directly
      setProject(projData);
      setApartments(aptsData.apartments || []);
    } catch (err) {
      console.error("loadData error:", err);
    }
    setLoading(false);
  }, [projectId, router, locale]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Open create form ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setSaveError("");
    setImageError("");
    setImageMode("upload");
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  /* ── Open edit form ── */
  const openEdit = (apt: Apartment) => {
    setEditTarget(apt);
    setForm({
      unitCode: apt.unitCode ?? "",
      buildingName: apt.buildingName ?? "",
      floor: apt.floor ?? "",
      area: apt.area ?? null,
      buildingArea: apt.buildingArea ?? null,
      roofArea: apt.roofArea ?? null,
      bedrooms: apt.bedrooms ?? null,
      bathrooms: apt.bathrooms ?? null,
      maidBathroom: apt.maidBathroom ?? null,
      price: apt.price ?? null,
      status: apt.status,
      type: apt.type ?? "شقة",
      image: apt.image ?? "",

      maidRoom: apt.maidRoom ?? 0,
      balcony: apt.balcony ?? 0,
      parking: apt.parking ?? 0,

      storage: apt.storage ?? 0,

      laundry: apt.laundry ?? 0,
      direction: apt.direction ?? "",
      view: apt.view ?? "",
    });
    setSaveError("");
    setImageError("");
    // A locally-uploaded image always starts with "/", an external link starts with http(s)://
    setImageMode(
      apt.image && /^https?:\/\//i.test(apt.image) ? "url" : "upload",
    );
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  /* ── Field helpers ── */
  const setField = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const numField = (key: string, raw: string) =>
    setField(key, raw === "" ? null : Number(raw));

  /* ── Image upload ── */
  const handleImageUpload = async (file: File) => {
    setUploadingImg(true);
    setImageError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setImageError(
          data.error ||
            (isRTL
              ? "فشل رفع الصورة، حاول تاني"
              : "Image upload failed, try again"),
        );
      } else {
        setField("image", data.url);
      }
    } catch {
      setImageError(
        isRTL
          ? "فشل رفع الصورة، تحقق من الاتصال"
          : "Upload failed, check your connection",
      );
    }
    setUploadingImg(false);
  };

  /* A pasted URL must actually be a link (or a path served by this app) —
       not a local file path like "C:\Users\...\pic.jpg" copied from Explorer. */
  const isValidImageUrl = (val: string) =>
    !val || /^https?:\/\//i.test(val) || val.startsWith("/");

  /* ── Save (create / update) ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unitCode || !String(form.unitCode).trim()) {
      setSaveError(isRTL ? "كود الوحدة مطلوب" : "Unit code is required");
      return;
    }
    if (!form.type || !String(form.type).trim()) {
      setSaveError(isRTL ? "نوع الوحدة مطلوب" : "Unit type is required");
      return;
    }
    if (
      form.price === null ||
      form.price === undefined ||
      isNaN(Number(form.price))
    ) {
      setSaveError(isRTL ? "السعر مطلوب" : "Price is required");
      return;
    }
    if (form.image && !isValidImageUrl(form.image)) {
      setSaveError(
        isRTL ? "رابط الصورة غير صحيح" : "The image URL is not valid",
      );
      return;
    }
    setSaving(true);
    setSaveError("");
    const payload = { ...form, projectId };

    try {
      const res = await fetch(
        editTarget ? `/api/apartments/${editTarget.id}` : "/api/apartments",
        {
          method: editTarget ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || (isRTL ? "حدث خطأ" : "Error occurred"));
      } else {
        setShowForm(false);
        loadData();
      }
    } catch {
      setSaveError(isRTL ? "خطأ في الاتصال" : "Network error");
    }
    setSaving(false);
  };

  /* ── Delete ── */
  const handleDelete = async (id: number) => {
    if (
      !confirm(
        isRTL ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?",
      )
    )
      return;
    setDeleteId(id);
    try {
      await fetch(`/api/apartments/${id}`, { method: "DELETE" });
      setApartments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert(isRTL ? "فشل الحذف" : "Delete failed");
    }
    setDeleteId(null);
  };

  /* ── Derived ── */
  const buildings = [
    ...new Set(apartments.map((a) => a.buildingName).filter(Boolean)),
  ] as string[];

  const filtered = apartments.filter((a) => {
    const matchBuilding = !filterBuilding || a.buildingName === filterBuilding;
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchSearch =
      !searchUnit ||
      (a.unitCode || "").toLowerCase().includes(searchUnit.toLowerCase()) ||
      (a.type || "").includes(searchUnit);
    return matchBuilding && matchStatus && matchSearch;
  });

  /* status badge */
  const statusBadge = (s: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s);
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: 700,
          background: opt ? opt.color + "1a" : "#f3f4f6",
          color: opt ? opt.color : "#374151",
          border: `1px solid ${opt ? opt.color + "40" : "#e5e7eb"}`,
        }}
      >
        {opt ? (isRTL ? opt.labelAr : opt.labelEn) : s}
      </span>
    );
  };

  /* ════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════ */
  return (
    <>
      {/* ── Breadcrumb ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        <Link
          href={`/${locale}/admin/apartments`}
          style={{ color: "#6b7280", textDecoration: "none" }}
        >
          {isRTL ? "الشقق" : "Apartments"}
        </Link>
        <span>/</span>
        <span style={{ color: "#1f2937", fontWeight: 600 }}>
          {project
            ? isRTL
              ? project.nameAr
              : project.nameEn || project.nameAr
            : "..."}
        </span>
      </div>

      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: "4px" }}>
            {project
              ? isRTL
                ? project.nameAr
                : project.nameEn || project.nameAr
              : "..."}
          </h1>
          <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
            {apartments.length} {isRTL ? "وحدة مسجلة" : "units registered"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => router.back()}
            className="admin-btn"
            style={{ background: "#f3f4f6", color: "#374151" }}
          >
            {isRTL ? "← رجوع" : "← Back"}
          </button>
          <button onClick={openCreate} className="admin-btn admin-btn-primary">
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {isRTL ? "إضافة وحدة" : "Add Unit"}
          </button>
        </div>
      </div>

      {/* ════════ FORM ════════ */}
      {showForm && (
        <section className={styles.editor} aria-labelledby="unit-editor-title">
          <header className={styles.header}>
            <div>
              <h2 id="unit-editor-title">
                {editTarget
                  ? isRTL ? "تعديل الوحدة" : "Edit unit"
                  : isRTL ? "إضافة وحدة جديدة" : "Add new unit"}
              </h2>
              <p>{isRTL ? "ابدأ بالبيانات الأساسية، ثم أضف تفاصيل الوحدة." : "Start with the essentials, then add the unit details."}</p>
            </div>
            <button type="button" className={styles.close} onClick={() => setShowForm(false)}
              aria-label={isRTL ? "إغلاق النموذج" : "Close form"}>×</button>
          </header>

          <form className={styles.form} onSubmit={handleSave}>
            <fieldset className={`${styles.card} ${styles.full}`}>
              <legend>{isRTL ? "البيانات الأساسية" : "Essentials"}</legend>
              <div className={styles.essentials}>
                <div className="admin-field">
                  <label htmlFor="unit-code">
                    {isRTL ? "كود الوحدة" : "Unit Code"}
                    <span style={{ color: "#dc2626" }}> *</span>
                  </label>
                  <input id="unit-code"
                    type="text"
                    value={form.unitCode ?? ""}
                    onChange={(e) => setField("unitCode", e.target.value || null)}
                    placeholder="e.g. A-101"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="unit-type">
                    {isRTL ? "النوع" : "Type"}
                    <span style={{ color: "#dc2626" }}> *</span>
                  </label>
                  <select id="unit-type"
                    value={form.type ?? ""}
                    onChange={(e) => setField("type", e.target.value)}
                    required
                  >
                    <option value="شقة">{isRTL ? "شقة" : "Apartment"}</option>
                    <option value="فيلا">{isRTL ? "فيلا" : "Villa"}</option>
                    <option value="دوبلكس">{isRTL ? "دوبلكس" : "Duplex"}</option>
                    <option value="روف">{isRTL ? "روف" : "Roof"}</option>
                    <option value="مكتب">{isRTL ? "مكتب" : "Office"}</option>
                    <option value="محل">{isRTL ? "محل تجاري" : "Shop"}</option>
                    <option value="أخرى">{isRTL ? "أخرى" : "Other"}</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="unit-price">
                    {isRTL ? "السعر (ريال سعودي)" : "Price (SAR)"}
                    <span style={{ color: "#dc2626" }}> *</span>
                  </label>
                  <input id="unit-price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.price ?? ""}
                    onChange={(e) => numField("price", e.target.value)}
                    placeholder="500,000"
                    required
                  />
                </div>
              </div>
              <p className={styles.preview}>
                <span>{isRTL ? "العنوان المعروض" : "Display title"}</span>
                <strong>{unitTitle({ type: form.type, unitCode: form.unitCode }, isRTL)}</strong>
              </p>

              <div className={styles.status} role="group" aria-label={isRTL ? "حالة الوحدة" : "Unit status"}>
                <strong>{isRTL ? "حالة الوحدة" : "Unit status"}</strong>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={form.status === opt.value}
                    onClick={() => setField("status", opt.value)}
                    style={{
                      padding: "7px 15px",
                      borderRadius: "8px",
                      border: `2px solid ${form.status === opt.value ? opt.color : "#e5e7eb"}`,
                      background:
                        form.status === opt.value ? opt.color + "18" : "#fff",
                      color: form.status === opt.value ? opt.color : "#6b7280",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                  >
                    {isRTL ? opt.labelAr : opt.labelEn}
                  </button>
                ))}
              </div>
              {form.status === "محجوب" && (
                <div className={styles.note}>
                  {isRTL
                    ? 'ℹ️ الوحدات "محجوبة" لا تظهر إطلاقًا في صفحة المشروع العامة للزوار.'
                    : 'ℹ️ "Hidden" units never appear on the public project page.'}
                </div>
              )}

            </fieldset>

            <fieldset className={styles.card}>
              <legend>{isRTL ? "الموقع داخل المشروع" : "Location within project"}</legend>
              <div className={styles.fields}>
                <div className="admin-field">
                  <label htmlFor="unit-building">
                    {isRTL ? "اسم المبنى (الزون)" : "Building Name (Zone)"}
                  </label>
                  <input id="unit-building"
                    type="text"
                    value={form.buildingName ?? ""}
                    onChange={(e) =>
                      setField("buildingName", e.target.value || null)
                    }
                    placeholder={isRTL ? "مثال: مبنى A" : "e.g. Building A"}
                    list="building-list"
                  />
                  <datalist id="building-list">
                    {buildings.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                <div className="admin-field">
                  <label htmlFor="unit-floor">{isRTL ? "الطابق" : "Floor"}</label>
                  <input id="unit-floor"
                    type="text"
                    value={form.floor ?? ""}
                    onChange={(e) => setField("floor", e.target.value || null)}
                    placeholder={
                      isRTL ? "مثال: الأول، الميزانين" : "e.g. 1, Mezzanine"
                    }
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="unit-direction">{isRTL ? "الاتجاه" : "Direction"}</label>
                  <select id="unit-direction"
                    value={form.direction ?? ""}
                    onChange={(e) =>
                      setField("direction", e.target.value || null)
                    }
                  >
                    <option value="">{isRTL ? "— اختر —" : "— Select —"}</option>
                    <option value="شمال">{isRTL ? "شمال" : "North"}</option>
                    <option value="جنوب">{isRTL ? "جنوب" : "South"}</option>
                    <option value="شرق">{isRTL ? "شرق" : "East"}</option>
                    <option value="غرب">{isRTL ? "غرب" : "West"}</option>
                    <option value="شمال شرق">
                      {isRTL ? "شمال شرق" : "North East"}
                    </option>
                    <option value="شمال غرب">
                      {isRTL ? "شمال غرب" : "North West"}
                    </option>
                    <option value="جنوب شرق">
                      {isRTL ? "جنوب شرق" : "South East"}
                    </option>
                    <option value="جنوب غرب">
                      {isRTL ? "جنوب غرب" : "South West"}
                    </option>
                    <option value="وسط">{isRTL ? "وسط" : "Center"}</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="unit-view">{isRTL ? "الإطلالة" : "View"}</label>
                  <input id="unit-view"
                    type="text"
                    value={form.view ?? ""}
                    onChange={(e) => setField("view", e.target.value || null)}
                    placeholder={
                      isRTL ? "مثال: إطلالة على الحديقة" : "e.g. Garden view"
                    }
                  />
                </div>
              </div>

            </fieldset>

            <fieldset className={styles.card}>
              <legend>{isRTL ? "المساحات" : "Dimensions"}</legend>
              <div className={styles.fields}>
                <div className="admin-field">
                  <label htmlFor="unit-total-area">
                    {isRTL ? "المساحة الكلية (م²)" : "Total Area (m²)"}
                  </label>
                  <input id="unit-total-area"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.area ?? ""}
                    onChange={(e) => numField("area", e.target.value)}
                    placeholder="120.5"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="unit-building-area">
                    {form.type === "محل"
                      ? isRTL
                        ? "مساحة الأرض (م²)"
                        : "Land Area (m²)"
                      : isRTL
                        ? "مساحة البناء (م²)"
                        : "Building Area (m²)"}
                  </label>
                  <input id="unit-building-area"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.buildingArea ?? ""}
                    onChange={(e) => numField("buildingArea", e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="unit-roof-area">
                    {form.type === "محل"
                      ? isRTL
                        ? "مساحة الميزانين (م²)"
                        : "Mezzanine Area (m²)"
                      : isRTL
                        ? "مساحة الروف (م²)"
                        : "Roof Area (m²)"}
                  </label>
                  <input id="unit-roof-area"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.roofArea ?? ""}
                    onChange={(e) => numField("roofArea", e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>

            </fieldset>

            <fieldset className={styles.card}>
              <legend>{isRTL ? "الغرف والمرافق" : "Rooms and facilities"}</legend>
              <div className={styles.fields}>
                {ROOM_FIELDS.map((field) => (
                  <div key={field.key} className="admin-field">
                    <label htmlFor={`unit-${field.key}`}>{isRTL ? field.labelAr : field.labelEn}</label>
                    <input
                      id={`unit-${field.key}`}
                      type="number"
                      min={0}
                      value={form[field.key] ?? ""}
                      onChange={(e) =>
                        setField(
                          field.key,
                          e.target.value === ""
                            ? NULLABLE_ROOM_FIELDS.includes(field.key)
                              ? null
                              : 0
                            : Number(e.target.value),
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

            </fieldset>

            <fieldset className={styles.card}>
              <legend>{isRTL ? "صورة الوحدة" : "Unit image"}</legend>
              <div>
                {/* Preview */}
                {form.image && (
                  <div
                    style={{
                      marginBottom: "14px",
                      position: "relative",
                      display: "inline-block",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.image}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = "0.3";
                      }}
                      style={{
                        width: "200px",
                        height: "130px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        display: "block",
                        border: "2px solid #e5e7eb",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setField("image", "");
                        setImageError("");
                      }}
                      title={isRTL ? "إزالة الصورة" : "Remove image"}
                      style={{
                        position: "absolute",
                        top: "8px",
                        insetInlineEnd: "8px",
                        background: "rgba(220,38,38,0.9)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "26px",
                        height: "26px",
                        cursor: "pointer",
                        fontSize: "15px",
                        display: "flex",
                        lineHeight: 0,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Mode tabs */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "12px",
                    background: "#f3f4f6",
                    borderRadius: "10px",
                    padding: "4px",
                    maxWidth: "360px",
                  }}
                >
                  {(["upload", "url"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setImageMode(mode);
                        setImageError("");
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: imageMode === mode ? "#fff" : "transparent",
                        color: imageMode === mode ? "#1f2937" : "#6b7280",
                        boxShadow:
                          imageMode === mode
                            ? "0 1px 3px rgba(0,0,0,0.12)"
                            : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {mode === "upload"
                        ? isRTL
                          ? "📤 رفع من الجهاز"
                          : "📤 Upload from device"
                        : isRTL
                          ? "🔗 لصق رابط"
                          : "🔗 Paste a URL"}
                    </button>
                  ))}
                </div>

                {/* Upload mode */}
                {imageMode === "upload" && (
                  <label
                    htmlFor="apt-image-file-input"
                    className="admin-upload-slot"
                    style={{
                      cursor: uploadingImg ? "wait" : "pointer",
                      opacity: uploadingImg ? 0.7 : 1,
                    }}
                  >
                    <svg
                      width="26"
                      height="26"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ color: "#9ca3af" }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      {uploadingImg
                        ? isRTL
                          ? "جاري الرفع..."
                          : "Uploading..."
                        : isRTL
                          ? "اضغط هنا لاختيار صورة"
                          : "Click here to choose an image"}
                    </span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {isRTL
                        ? "JPG, PNG أو WEBP — حتى 10MB"
                        : "JPG, PNG or WEBP — up to 10MB"}
                    </span>
                    <input
                      id="apt-image-file-input"
                      type="file"
                      accept="image/*"
                      disabled={uploadingImg}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}

                {/* URL mode */}
                {imageMode === "url" && (
                  <div className="admin-field" style={{ maxWidth: "480px" }}>
                    <label style={{ fontSize: "12px", color: "#6b7280" }}>
                      {isRTL
                        ? "رابط الصورة (يبدأ بـ https://)"
                        : "Image URL (must start with https://)"}
                    </label>
                    <input
                      type="url"
                      value={form.image ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setField("image", val || null);
                        setImageError(
                          isValidImageUrl(val)
                            ? ""
                            : isRTL
                              ? "هذا الرابط غير صحيح — يجب أن يبدأ بـ http:// أو https://‏ (وليس مسارًا من جهازك مثل  C:\\...)"
                              : "Not a valid link — it must start with http:// or https:// (not a local file path like C:\\...)",
                        );
                      }}
                      placeholder="https://example.com/image.jpg"
                      dir="ltr"
                      style={
                        form.image && !isValidImageUrl(form.image)
                          ? { borderColor: "#dc2626" }
                          : undefined
                      }
                    />
                  </div>
                )}

                {imageError && (
                  <p
                    style={{
                      color: "#dc2626",
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    ⚠️ {imageError}
                  </p>
                )}
              </div>

            </fieldset>

            {/* ─ Error message ─ */}
            {saveError && (
              <div role="alert" className={styles.full}
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                ⚠️ {saveError}
              </div>
            )}

            {/* ─ Actions ─ */}
            <div className={styles.actions}>
              <p>{isRTL ? "* حقول مطلوبة" : "* Required fields"}</p>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="admin-btn"
                style={{ background: "#f3f4f6", color: "#374151" }}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={saving || uploadingImg}
                style={{ minWidth: "130px" }}
              >
                {saving
                  ? isRTL
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : editTarget
                    ? isRTL
                      ? "حفظ التعديلات"
                      : "Save changes"
                    : isRTL
                      ? "إضافة الوحدة"
                      : "Add unit"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ════════ FILTERS ════════ */}
      {!loading && apartments.length > 0 && (
        <div
          className="admin-card"
          style={{ marginBottom: "20px", padding: "16px 20px" }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Search input */}
            <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  left: "10px",
                  color: "#9ca3af",
                  pointerEvents: "none",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="text"
                placeholder={
                  isRTL
                    ? "ابحث بالكود أو الاسم..."
                    : "Search by code or name..."
                }
                value={searchUnit}
                onChange={(e) => setSearchUnit(e.target.value)}
                style={{
                  width: "100%",
                  paddingLeft: "32px",
                  paddingRight: "12px",
                  height: "36px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "13px",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Building filter */}
            {buildings.length > 0 && (
              <select
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                style={{
                  height: "36px",
                  padding: "0 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "13px",
                  outline: "none",
                  background: "#fff",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <option value="">
                  {isRTL ? "كل المباني" : "All Buildings"}
                </option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                height: "36px",
                padding: "0 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                background: "#fff",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              <option value="">{isRTL ? "كل الحالات" : "All Statuses"}</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {isRTL ? o.labelAr : o.labelEn}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {(filterBuilding || filterStatus || searchUnit) && (
              <button
                onClick={() => {
                  setFilterBuilding("");
                  setFilterStatus("");
                  setSearchUnit("");
                }}
                style={{
                  height: "36px",
                  padding: "0 14px",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  background: "#fff",
                  color: "#dc2626",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {isRTL ? "✕ مسح الفلاتر" : "✕ Clear"}
              </button>
            )}

            <span
              style={{
                fontSize: "12px",
                color: "#9ca3af",
                marginInlineStart: "auto",
              }}
            >
              {filtered.length} / {apartments.length} {isRTL ? "وحدة" : "units"}
            </span>
          </div>
        </div>
      )}

      {/* ════════ TABLE ════════ */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 16px" }} />
          <p>{isRTL ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      ) : apartments.length === 0 ? (
        <div
          className="admin-card"
          style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}
        >
          <svg
            width="56"
            height="56"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
            {isRTL ? "لا توجد وحدات بعد" : "No units yet"}
          </p>
          <p style={{ fontSize: "13px" }}>
            {isRTL
              ? 'اضغط على "إضافة وحدة" للبدء'
              : 'Click "Add Unit" to get started'}
          </p>
          <button
            onClick={openCreate}
            className="admin-btn admin-btn-primary"
            style={{ marginTop: "16px" }}
          >
            {isRTL ? "➕ إضافة وحدة" : "Add unit"}
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isRTL ? "الصورة" : "Image"}</th>
                <th>{isRTL ? "الكود" : "Code"}</th>
                <th>{isRTL ? "الوحدة" : "Unit"}</th>
                <th>{isRTL ? "المبنى" : "Building"}</th>
                <th>{isRTL ? "الطابق" : "Floor"}</th>
                <th>{isRTL ? "المساحة" : "Area"}</th>
                <th>{isRTL ? "الغرف" : "Rooms"}</th>
                <th>{isRTL ? "السعر" : "Price"}</th>
                <th>{isRTL ? "الحالة" : "Status"}</th>
                <th>{isRTL ? "المميزات" : "Features"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((apt) => {
                const name = unitTitle(apt, isRTL);
                const featureCount = ROOM_FIELDS.filter(
                  (f) =>
                    !!apt[f.key as RoomFieldKey] &&
                    f.key !== "bedrooms" &&
                    f.key !== "bathrooms",
                ).length;

                return (
                  <tr key={apt.id}>
                    {/* Image */}
                    <td>
                      {apt.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className="row-thumb"
                          src={apt.image}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            background: "#f3f4f6",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                          }}
                        >
                          🏠
                        </div>
                      )}
                    </td>

                    {/* Code */}
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "12px",
                          background: "#f3f4f6",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: "#374151",
                        }}
                      >
                        {apt.unitCode || "—"}
                      </span>
                    </td>

                    {/* Title (generated: type + code) */}
                    <td>
                      <span style={{ fontWeight: 600, color: "#1f2937" }}>
                        {name}
                      </span>
                    </td>

                    {/* Building */}
                    <td style={{ color: "#6b7280", fontSize: "13px" }}>
                      {apt.buildingName || "—"}
                    </td>

                    {/* Floor */}
                    <td style={{ textAlign: "center", color: "#374151" }}>
                      {apt.floor ?? "—"}
                    </td>

                    {/* Area */}
                    <td style={{ fontSize: "13px", color: "#374151" }}>
                      {apt.area ? `${apt.area} م²` : "—"}
                      {apt.buildingArea && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#9ca3af",
                            display: "block",
                          }}
                        >
                          {apt.type === "محل"
                            ? isRTL
                              ? `أرض: ${apt.buildingArea}`
                              : `Land: ${apt.buildingArea}`
                            : isRTL
                              ? `بناء: ${apt.buildingArea}`
                              : `Build: ${apt.buildingArea}`}
                        </span>
                      )}
                    </td>

                    {/* Rooms */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {apt.bedrooms != null && (
                          <span
                            style={{ fontSize: "12px", color: "#374151" }}
                            title={isRTL ? "غرف نوم" : "Bedrooms"}
                          >
                            🛏️ {apt.bedrooms}
                          </span>
                        )}
                        {apt.bathrooms != null && (
                          <span
                            style={{ fontSize: "12px", color: "#374151" }}
                            title={isRTL ? "دورات مياه" : "Bathrooms"}
                          >
                            🚿 {apt.bathrooms}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td
                      style={{
                        fontWeight: 600,
                        color: "#059669",
                        fontSize: "13px",
                      }}
                    >
                      {apt.price
                        ? apt.price.toLocaleString(isRTL ? "ar-SA" : "en-US") +
                          (isRTL ? " ر.س" : " SAR")
                        : "—"}
                    </td>

                    {/* Status */}
                    <td>{statusBadge(apt.status)}</td>

                    {/* Features */}
                    <td style={{ textAlign: "center" }}>
                      {featureCount > 0 ? (
                        <span
                          style={{
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {featureCount} ✨
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => openEdit(apt)}
                          className="admin-btn-icon"
                          title={isRTL ? "تعديل" : "Edit"}
                        >
                          <svg
                            width="15"
                            height="15"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(apt.id)}
                          className="admin-btn-icon danger"
                          title={isRTL ? "حذف" : "Delete"}
                          disabled={deleteId === apt.id}
                        >
                          <svg
                            width="15"
                            height="15"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
