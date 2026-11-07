"use client";

import {
  createContext,
  use,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Milestone, CalendarDays, Files } from "lucide-react";
import { useLocale } from "next-intl";
import s from "./timeline.module.css";

/* ============================================================
   Project timeline (admin): phases + monthly records of ONE project.
   The server enforces every rule; the checks here only make the
   screen friendlier (disabled buttons, counters, messages).
   ============================================================ */

type ColType = "number" | "percent" | "text";
type Source = "COLORIDEA" | "MANUAL";
type Report = { columns: Column[] } | null;
type Outputs = {
  monthly_video?: Item[];
  ground?: Item[];
  aerial?: Item[];
  photo?: Item[];
  timelapse?: Item[];
} | null;

interface Column {
  name: string;
  type: ColType;
  value: number | string | null;
  valueEn?: string | null;
}
interface Item {
  id?: string;
  name: string | null;
  link: string | null;
  photo: string | null;
}
interface MonthlyRecord {
  id: number;
  month: string;
  source: Source;
  externalProjectId: string | null;
  originNote: string | null;
  report: Report;
  outputs: Outputs;
  phase: { id: number; isLatest: boolean } | null;
}
interface Phase {
  id: number;
  coverImage: string;
  isLatest: boolean;
  sortOrder: number;
  monthlyData: {
    id: number;
    month: string;
    source: Source;
    originNote: string | null;
    report: Report;
    outputs: Outputs;
  };
}

type TabKey = "numbers" | "report" | "video" | "ground" | "aerial" | "photo" | "timelapse";
type MediaKind = "media" | "video"; // media = image or video
interface NumRow {
  name: string;
  type: "number" | "percent";
  value: string;
  preset?: boolean; // untouched preset rows (no value) are ignored
}
interface MediaRow {
  name: string;
  link: string;
  photo: string; // optional thumbnail
}
interface Draft {
  month: string;
  originNote: string;
  numbers: NumRow[];
  notes: string;
  notesEn: string;
  reading: string;
  readingEn: string;
  upcoming: string;
  upcomingEn: string;
  extraTexts: { name: string; value: string }[]; // other text columns of an older record: kept as they are
  video: MediaRow;
  ground: MediaRow[];
  aerial: MediaRow[];
  photo: MediaRow[];
  timelapse: MediaRow[];
  droppedVideos: number; // older records could hold several monthly videos; only the first one is kept
}
interface FormError {
  tab: TabKey;
  msg: string;
}
type Payload = ReturnType<typeof analyze>["payload"];
type TFn = (ar: string, en: string) => string;

const MIN_PERCENTS = 3;
const MAX_MEDIA = 20;
const MAX_TEXT = 2000;
const MAX_NAME = 200;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const IMG_EXT_RE = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|avi)$/i;
const OVERALL_NAME = "الإجمالي الفعلي";
const NOTES_NAME = "ملاحظات";
const READING_NAME = "قراءة الإنجاز";
const UPCOMING_NAME = "المراحل القادمة المتوقعة";
const ENGINEERING_NAMES = [NOTES_NAME, READING_NAME, UPCOMING_NAME];
const IMG_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const IMG_ACCEPT = IMG_TYPES.join(",");
const VIDEO_ACCEPT = VIDEO_TYPES.join(",");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // same limits as /api/upload
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const COVER_HELP =
  "صورة المرحلة مطلوبة: ارفع صورة من جهازك أو حط لينك صورة مباشر ينتهي بـ jpg / png / webp / gif";
const COVER_HELP_EN =
  "A cover image is required: upload an image or paste a direct image link ending in jpg / png / webp / gif";

// the columns a real ColorIdea report has (the card shows the first 6 percents after the overall one)
const PRESET_NUMBERS = [
  OVERALL_NAME,
  "التصميم",
  "أعمال تجهيز الموقع",
  "أوامر الشراء والعقود",
  "أعمال العظم",
  "التشطيبات",
  "أعمال الكتروميكانيك",
];

const blankNum = (type: "number" | "percent" = "percent"): NumRow => ({ name: "", type, value: "" });
const blankMedia = (): MediaRow => ({ name: "", link: "", photo: "" });
const presetNumbers = (): NumRow[] => PRESET_NUMBERS.map((name) => ({ name, type: "percent", value: "", preset: true }));
const emptyDraft = (): Draft => ({
  month: "",
  originNote: "",
  numbers: presetNumbers(),
  notes: "",
  notesEn: "",
  reading: "",
  readingEn: "",
  upcoming: "",
  upcomingEn: "",
  extraTexts: [],
  video: blankMedia(),
  ground: [],
  aerial: [],
  photo: [],
  timelapse: [],
  droppedVideos: 0,
});

/* ---------- link rules (the same ones the server enforces) ---------- */
const isHttpOrUpload = (s: string) => /^(https?:\/\/|\/uploads\/)/i.test(s) && !s.includes("..") && s.length <= 2000;

function pathOf(s: string): string {
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).pathname;
    } catch {
      return "";
    }
  }
  return s.split(/[?#]/)[0];
}

// a real image: our own upload, or a link ending with an image extension (query/hash ignored)
function isImageLink(v: string): boolean {
  const s = v.trim();
  return isHttpOrUpload(s) && IMG_EXT_RE.test(pathOf(s));
}

const VIDEO_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com", "player.vimeo.com"];

// an external link that really points to ONE image or video (a Drive FOLDER is not accepted)
function isDirectMediaLink(s: string): boolean {
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (IMG_EXT_RE.test(url.pathname) || VIDEO_EXT_RE.test(url.pathname)) return true;
  if (VIDEO_HOSTS.includes(host)) return true;
  return host === "drive.google.com" && /^\/file\/d\/[^/]+/.test(url.pathname);
}

// media link: an uploaded file must be an image/video (never a PDF).
// kind "media" (ground / aerial / photography): an external link must be a direct image/video link.
// kind "video" (monthly video, timelapse): any external link is accepted.
function mediaLinkError(link: string, kind: MediaKind, t: TFn): string | null {
  const s = link.trim();
  if (!s) return t("الرابط مطلوب", "The link is required");
  if (!isHttpOrUpload(s)) return t("الرابط غير صالح (لازم يبدأ بـ http أو https)", "Invalid link (must start with http or https)");
  if (/^\/uploads\//i.test(s)) {
    const p = pathOf(s);
    const ok = kind === "video" ? VIDEO_EXT_RE.test(p) : IMG_EXT_RE.test(p) || VIDEO_EXT_RE.test(p);
    if (!ok) {
      return kind === "video"
        ? t("لازم يكون ملف فيديو أو لينك", "Must be a video file or a link")
        : t("لازم يكون صورة أو فيديو أو لينك", "Must be an image, a video or a link");
    }
  } else if (kind === "media" && !isDirectMediaLink(s)) {
    return t(
      "لازم صورة أو فيديو: ارفع ملف، أو حط لينك مباشر (صورة، فيديو، يوتيوب، فيميو، أو ملف واحد من Drive). لينك فولدر Drive مش مقبول",
      "Must be an image or a video: upload a file, or use a direct link (image, video, YouTube, Vimeo, or a single Drive file). Drive folder links are not accepted",
    );
  }
  return null;
}

function thumbError(photo: string, t: TFn): string | null {
  if (!photo.trim() || isImageLink(photo)) return null;
  return t(
    "الصورة المصغّرة لازم تكون صورة (ارفعها أو حط لينك ينتهي بـ jpg / png / webp / gif)",
    "The thumbnail must be an image (upload it or use a link ending in jpg / png / webp / gif)",
  );
}

// client-side check before uploading (the server checks again)
function checkFile(file: File, kind: "image" | "video" | "media", t: TFn): string | null {
  const isImg = IMG_TYPES.includes(file.type);
  const isVid = VIDEO_TYPES.includes(file.type);
  if (kind === "image" && !isImg) return t("لازم صورة (jpg أو png أو webp أو gif)", "Must be an image (jpg, png, webp or gif)");
  if (kind === "video" && !isVid) return t("لازم فيديو (mp4 أو webm أو mov أو avi)", "Must be a video (mp4, webm, mov or avi)");
  if (kind === "media" && !isImg && !isVid) return t("لازم صورة أو فيديو", "Must be an image or a video");
  if (isImg && file.size > MAX_IMAGE_BYTES) return t("حجم الصورة أكبر من 10MB", "The image is larger than 10MB");
  if (isVid && file.size > MAX_VIDEO_BYTES) return t("حجم الفيديو أكبر من 50MB", "The video is larger than 50MB");
  return null;
}

const rowFilled = (r: MediaRow) => !!(r.name.trim() || r.link.trim() || r.photo.trim());

function draftFromRecord(r: Phase["monthlyData"]): Draft {
  const cols = r.report?.columns ?? [];
  const numbers: NumRow[] = cols
    .filter((c) => c.type !== "text")
    .map((c) => ({
      name: c.name,
      type: c.type === "percent" ? "percent" : "number",
      value: c.value === null || c.value === undefined ? "" : String(c.value),
    }));
  const textOf = (name: string) => {
    const c = cols.find((x) => x.type === "text" && x.name.trim() === name);
    return c && c.value !== null && c.value !== undefined ? String(c.value) : "";
  };
  const toRows = (a?: Item[]): MediaRow[] =>
    (a ?? []).map((v) => ({ name: v.name ?? "", link: v.link ?? "", photo: v.photo ?? "" }));
  const mv = toRows(r.outputs?.monthly_video);

  return {
    month: r.month,
    originNote: r.originNote ?? "",
    numbers: numbers.length ? numbers : presetNumbers(),
    notes: textOf(NOTES_NAME),
    notesEn: cols.find((c) => c.type === "text" && c.name.trim() === NOTES_NAME)?.valueEn ?? "",
    reading: textOf(READING_NAME),
    readingEn: cols.find((c) => c.type === "text" && c.name.trim() === READING_NAME)?.valueEn ?? "",
    upcoming: textOf(UPCOMING_NAME),
    upcomingEn: cols.find((c) => c.type === "text" && c.name.trim() === UPCOMING_NAME)?.valueEn ?? "",
    extraTexts: cols
      .filter((c) => c.type === "text" && !ENGINEERING_NAMES.includes(c.name.trim()))
      .map((c) => ({ name: c.name, value: String(c.value ?? "") })),
    video: mv[0] ?? blankMedia(),
    ground: toRows(r.outputs?.ground),
    aerial: toRows(r.outputs?.aerial),
    photo: toRows(r.outputs?.photo),
    timelapse: toRows(r.outputs?.timelapse),
    droppedVideos: Math.max(0, mv.length - 1),
  };
}

/** mirrors the server rules; ignored rows are empty; half-filled rows are errors */
function analyze(d: Draft, t: TFn) {
  const errors: FormError[] = [];
  const add = (tab: TabKey, msg: string) => errors.push({ tab, msg });

  if (!MONTH_RE.test(d.month)) add("numbers", t("اختار الشهر", "Choose the month"));

  // numbers
  const nums = d.numbers.filter((c) => c.value.trim() || (!c.preset && c.name.trim()));
  nums.forEach((c, i) => {
    const label = t(`الرقم ${i + 1}`, `Number ${i + 1}`);
    if (!c.name.trim()) add("numbers", `${label}: ${t("الاسم مطلوب", "name is required")}`);
    else if (c.name.trim().length > MAX_NAME) add("numbers", `${label}: ${t("الاسم طويل", "name is too long")}`);
    const n = c.value.trim() === "" ? NaN : Number(c.value);
    if (!Number.isFinite(n)) add("numbers", `${label}: ${t("القيمة لازم تكون رقم", "value must be a number")}`);
    else if (c.type === "percent" && (n < 0 || n > 100)) {
      add("numbers", `${label}: ${t("النسبة بين 0 و 100", "percent must be 0-100")}`);
    }
  });
  const percents = nums.filter((c) => c.type === "percent" && c.value.trim() !== "" && Number.isFinite(Number(c.value))).length;
  if (percents < MIN_PERCENTS) {
    add("numbers", t(`لازم ${MIN_PERCENTS} نسب مئوية على الأقل`, `At least ${MIN_PERCENTS} percentages are required`));
  }

  // engineering report (all optional)
  (
    [
      [d.notesEn, t("ملاحظات (إنجليزي)", "Notes (English)")],
      [d.notes, t("الملاحظات", "Notes")],
      [d.readingEn, t("قراءة الإنجاز (إنجليزي)", "Reading (English)")],
      [d.reading, t("قراءة الإنجاز", "Progress reading")],
      [d.upcomingEn, t("المراحل القادمة (إنجليزي)", "Upcoming (English)")],
      [d.upcoming, t("المراحل القادمة", "Upcoming phases")],
    ] as const
  ).forEach(([v, label]) => {
    if (v.trim().length > MAX_TEXT) add("report", `${label}: ${t(`أطول من ${MAX_TEXT} حرف`, `longer than ${MAX_TEXT} characters`)}`);
  });

  // media
  const checkRow = (tab: TabKey, r: MediaRow, kind: MediaKind, label: string) => {
    if (!rowFilled(r)) return;
    const le = mediaLinkError(r.link, kind, t);
    if (le) add(tab, `${label}: ${le}`);
    const te = thumbError(r.photo, t);
    if (te) add(tab, `${label}: ${te}`);
    if (r.name.trim().length > MAX_NAME) add(tab, `${label}: ${t("الاسم طويل", "name is too long")}`);
  };
  checkRow("video", d.video, "video", t("الفيديو الشهري", "Monthly video"));
  const lists: [TabKey, MediaRow[], MediaKind, string][] = [
    ["ground", d.ground, "media", t("التصوير الأرضي", "Ground")],
    ["aerial", d.aerial, "media", t("التصوير الجوي", "Aerial")],
    ["photo", d.photo, "media", t("التصوير الفوتوغرافي", "Photography")],
    ["timelapse", d.timelapse, "video", t("التايم لابس", "Timelapse")],
  ];
  lists.forEach(([tab, rows, kind, label]) => {
    const filled = rows.filter(rowFilled);
    if (filled.length > MAX_MEDIA) add(tab, `${label}: ${t(`الحد الأقصى ${MAX_MEDIA}`, `maximum is ${MAX_MEDIA}`)}`);
    filled.forEach((r, i) => checkRow(tab, r, kind, `${label} (${i + 1})`));
  });

  const item = (r: MediaRow) => ({ name: r.name.trim() || null, link: r.link.trim(), photo: r.photo.trim() || null });
  const text = (name: string, v: string, valueEn = "") => (v.trim() || valueEn.trim() ? [{ name, type: "text" as ColType, value: v.trim(), valueEn: valueEn.trim() || null }] : []);
  const columns: { name: string; type: ColType; value: number | string; valueEn?: string | null }[] = [
    ...nums.map((c) => ({ name: c.name.trim(), type: c.type as ColType, value: Number(c.value) })),
    ...text(NOTES_NAME, d.notes, d.notesEn),
    ...text(READING_NAME, d.reading, d.readingEn),
    ...text(UPCOMING_NAME, d.upcoming, d.upcomingEn),
    ...d.extraTexts.flatMap((x) => text(x.name.trim(), x.value)),
  ];

  const payload = {
    month: d.month,
    originNote: d.originNote.trim() || null,
    columns,
    monthlyVideo: rowFilled(d.video) ? item(d.video) : null,
    ground: d.ground.filter(rowFilled).map(item),
    aerial: d.aerial.filter(rowFilled).map(item),
    photo: d.photo.filter(rowFilled).map(item),
    timelapse: d.timelapse.filter(rowFilled).map(item),
  };

  const counts = {
    percents,
    engineering: [[d.notes, d.notesEn], [d.reading, d.readingEn], [d.upcoming, d.upcomingEn]].filter((pair) => pair.some((v) => v.trim())).length,
    video: rowFilled(d.video) ? 1 : 0,
    ground: payload.ground.length,
    aerial: payload.aerial.length,
    photo: payload.photo.length,
    timelapse: payload.timelapse.length,
  };

  return { errors, payload, counts };
}

/** overall %, up to 6 percent boxes and counts of a record (same idea the public card will use) */
function summarize(report: Report, outputs: Outputs) {
  const cols = report?.columns ?? [];
  const isNum = (c: Column) => c.value !== null && c.value !== "" && Number.isFinite(Number(c.value));
  const overallCol = cols.find((c) => c.name.trim() === OVERALL_NAME && isNum(c));
  const metrics = cols
    .filter((c) => c.type === "percent" && c.name.trim() !== OVERALL_NAME && isNum(c))
    .slice(0, 6)
    .map((c) => ({ name: c.name, value: Number(c.value) }));
  const n = (a?: Item[]) => a?.length ?? 0;
  return {
    overall: overallCol ? Number(overallCol.value) : null,
    metrics,
    columnsCount: cols.length,
    // same rule as the server: a phase can only use a record that has at least one number
    hasNumbers: cols.some((c) => (c.type === "percent" || c.type === "number") && typeof c.value === "number" && Number.isFinite(c.value)),
    media: {
      video: n(outputs?.monthly_video),
      ground: n(outputs?.ground),
      aerial: n(outputs?.aerial),
      photo: n(outputs?.photo),
      timelapse: n(outputs?.timelapse),
    },
  };
}

function metaLine(sm: ReturnType<typeof summarize>, t: TFn): string {
  const parts: string[] = [
    sm.columnsCount > 0
      ? t(`${sm.columnsCount} أرقام ونصوص`, `${sm.columnsCount} numbers & texts`)
      : t("بدون تقرير", "No report"),
  ];
  const m = sm.media;
  if (m.video) parts.push(t(`فيديو شهري ${m.video}`, `${m.video} monthly video`));
  if (m.ground) parts.push(t(`أرضي ${m.ground}`, `${m.ground} ground`));
  if (m.aerial) parts.push(t(`جوي ${m.aerial}`, `${m.aerial} aerial`));
  if (m.photo) parts.push(t(`فوتوغرافي ${m.photo}`, `${m.photo} photos`));
  if (m.timelapse) parts.push(t(`تايم لابس ${m.timelapse}`, `${m.timelapse} timelapse`));
  return parts.join(" · ");
}

const fmtPct = (n: number) => `${Math.round(n * 10) / 10}%`;

async function uploadFile(file: File): Promise<{ url: string } | { error: string }> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) return { error: typeof d.error === "string" ? d.error : "Upload failed" };
    return typeof d.url === "string" ? { url: d.url } : { error: "Upload failed" };
  } catch {
    return { error: "Upload failed" };
  }
}

/* ---------- language ---------- */
const LangCtx = createContext<{
  t: (ar: string, en: string) => string;
  fmtMonth: (m: string) => string;
}>({ t: (ar) => ar, fmtMonth: (m) => m });
const useLang = () => useContext(LangCtx);

/* ---------- small pieces ---------- */
function SourceBadge({ source }: { source: Source }) {
  const { t } = useLang();
  return source === "COLORIDEA" ? (
    <span className={`${s.badge} ${s.badgeCI}`}>ColorIdea</span>
  ) : (
    <span className={s.badge}>{t("يدوي", "Manual")}</span>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className={s.seg} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`${s.segBtn} ${value === o.value ? s.segActive : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
  footer,
  size,
  strict,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "wide" | "wizard";
  strict?: boolean; // forms: clicking outside / Esc must not throw typed data away
}) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !strict) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [strict]);

  return (
    <div
      className={`${s.overlay} ${size === "wizard" ? s.wizardOverlay : ""}`}
      onMouseDown={(e) => {
        if (!strict && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${s.modal} ${size === "wide" ? s.modalWide : ""} ${size === "sm" ? s.modalSm : ""} ${size === "wizard" ? s.wizardModal : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>{title}</h3>
          <button type="button" className={s.close} onClick={onClose} aria-label="close">
            ×
          </button>
        </div>
        <div className={s.modalBody}>{children}</div>
        {footer && <div className={s.modalFoot}>{footer}</div>}
      </div>
    </div>
  );
}

type Msg = { type: "success" | "error"; text: string };

function Toast({ msg, onClose }: { msg: Msg; onClose: () => void }) {
  useEffect(() => {
    if (msg.type !== "success") return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [msg, onClose]);

  return (
    <div className={`${s.toast} ${msg.type === "success" ? s.toastOk : s.toastErr}`} role="status">
      <span>{msg.text}</span>
      <button type="button" className={s.toastClose} onClick={onClose} aria-label="close">
        ×
      </button>
    </div>
  );
}

/* ---------- choose an existing (free) record ---------- */
function RecordPicker({
  records,
  value,
  onChange,
  onManual,
}: {
  records: MonthlyRecord[];
  value: number | null;
  onChange: (id: number) => void;
  onManual: () => void;
}) {
  const { t, fmtMonth } = useLang();
  const [filter, setFilter] = useState<"all" | Source>("all");

  if (records.length === 0) {
    return (
      <div className={s.empty}>
        <div className={s.emptyTitle}>{t("لا توجد سجلات متاحة", "No free records")}</div>
        {t(
          "كل السجلات مستخدمة في مراحل، أو لم يتم سحب بيانات بعد.",
          "All records are used by phases, or nothing has been synced yet.",
        )}
        <div style={{ marginTop: 12 }}>
          <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={onManual}>
            {t("إدخال بيانات يدوية", "Enter manual data")}
          </button>
        </div>
      </div>
    );
  }

  const both = new Set(records.map((r) => r.source)).size > 1;
  const list = records.filter((r) => filter === "all" || r.source === filter);

  return (
    <div>
      {both && (
        <div className={s.chips}>
          {(
            [
              ["all", t("الكل", "All")],
              ["COLORIDEA", "ColorIdea"],
              ["MANUAL", t("يدوي", "Manual")],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`${s.chip} ${filter === k ? s.chipActive : ""}`}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className={s.pick} role="radiogroup">
        {list.map((r) => {
          const sm = summarize(r.report, r.outputs);
          const on = value === r.id;
          const usable = sm.hasNumbers || r.phase !== null; // The attached record can be kept without replacing it.
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-disabled={!usable}
              disabled={!usable}
              className={`${s.pickItem} ${on ? s.pickSel : ""} ${!usable ? s.pickDisabled : ""}`}
              onClick={() => usable && onChange(r.id)}
            >
              <span className={`${s.radio} ${on ? s.radioOn : ""}`} />
              <span className={s.pickBody}>
                <span className={s.pickTitle}>
                  {fmtMonth(r.month)} <SourceBadge source={r.source} />
                  {r.phase && <span className={s.pickMeta}>{t("السجل الحالي", "Current record")}</span>}
                </span>
                <span className={s.pickMeta}>
                  {metaLine(sm, t)}
                  {r.originNote ? ` · ${r.originNote}` : ""}
                </span>
                {!usable && (
                  <span className={s.pickWhy}>
                    {t("بدون تقرير: مينفعش تتربط بمرحلة (مفيش أرقام)", "No report: it cannot be used by a phase (no numbers)")}
                  </span>
                )}
              </span>
              <span className={s.pickPct}>{sm.overall !== null ? fmtPct(sm.overall) : "—"}</span>
            </button>
          );
        })}
        {list.length === 0 && <div className={s.empty}>{t("لا توجد نتائج", "No results")}</div>}
      </div>
    </div>
  );
}

/* ---------- a list of media items (link or upload), or a single one ---------- */
function MediaList({
  rows,
  onChange,
  mode,
  onUploading,
}: {
  rows: MediaRow[];
  onChange: (rows: MediaRow[]) => void;
  mode: "monthly" | "batch" | "links";
  onUploading: (value: boolean) => void;
}) {
  const { t } = useLang();
  const picker = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const monthly = mode === "monthly";
  const batch = mode === "batch";
  const max = monthly ? 1 : MAX_MEDIA;

  async function upload(files: File[]) {
    if (!files.length || busy) return;
    const remaining = monthly ? 1 : max - rows.length;
    if (files.length > remaining) {
      setErrors([t(`يمكنك اختيار ${remaining} ملف كحد أقصى الآن.`, `You can select up to ${remaining} files now.`)]);
      return;
    }

    setBusy(true);
    onUploading(true);
    setErrors([]);
    const uploaded: MediaRow[] = [];
    const failures: string[] = [];

    try {
      for (const file of files) {
        const invalid = checkFile(file, monthly ? "video" : "media", t);
        if (invalid) {
          failures.push(`${file.name}: ${invalid}`);
          continue;
        }
        const result = await uploadFile(file);
        if ("url" in result) uploaded.push({ ...blankMedia(), link: result.url });
        else failures.push(`${file.name}: ${t("تعذّر رفع الملف. جرّب مرة أخرى.", "Could not upload the file. Try again.")}`);
      }
      if (uploaded.length) {
        onChange(monthly ? [{ ...rows[0], link: uploaded[0].link }] : [...rows, ...uploaded]);
      }
      setErrors(failures);
    } finally {
      setBusy(false);
      onUploading(false);
    }
  }

  return (
    <div>
      {mode !== "links" && (
        <input ref={picker} type="file" hidden multiple={batch}
          accept={monthly ? VIDEO_ACCEPT : `${IMG_ACCEPT},${VIDEO_ACCEPT}`}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void upload(files);
          }} />
      )}
      {batch && (
        <p className={s.note}>
          {t("اضغط «إضافة ملفات» لاختيار صور أو فيديوهات دفعة واحدة. الحد الأقصى ٢٠ ملفًا في هذا القسم.",
            "Select Add files to upload photos or videos together. This section accepts up to 20 files.")}
        </p>
      )}
      {rows.map((row, index) => {
        const error = row.link.trim() ? mediaLinkError(row.link, batch ? "media" : "video", t) : null;
        const label = monthly ? t("رابط الفيديو", "Video link") : t(`رابط التايم لابس ${index + 1}`, `Timelapse link ${index + 1}`);
        return (
          <div key={index} className={s.mediaEntry}>
            <div className={s.mediaLine}>
              {batch ? (
                <span className={s.mediaFile}>
                  {isHttpOrUpload(row.link) ? (
                    <a href={row.link} target="_blank" rel="noopener noreferrer">
                      {row.name || pathOf(row.link).split("/").pop() || t(`ملف ${index + 1}`, `File ${index + 1}`)}
                    </a>
                  ) : t(`ملف ${index + 1}`, `File ${index + 1}`)}
                </span>
              ) : (
                <input className={s.input} type="text" dir="ltr" aria-label={label}
                  placeholder={monthly ? t("الصق رابط الفيديو", "Paste the video link") : "https://…"}
                  value={row.link} disabled={busy}
                  onChange={(e) => {
                    const link = e.target.value;
                    onChange(rows.map((item, i) => i === index
                      ? link.trim() ? { ...item, link } : blankMedia()
                      : item));
                  }} />
              )}
              {monthly && (
                <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                  disabled={busy} onClick={() => picker.current?.click()}>
                  {busy ? t("جارٍ الرفع…", "Uploading…") : t("رفع فيديو", "Upload video")}
                </button>
              )}
              <button type="button" className={s.iconBtn}
                aria-label={t(`إزالة العنصر ${index + 1}`, `Remove item ${index + 1}`)}
                disabled={busy || (monthly && !rowFilled(row))}
                onClick={() => onChange(monthly ? [blankMedia()] : rows.filter((_, i) => i !== index))}>×</button>
            </div>
            {error && <div className={s.fieldError}>{error}</div>}
          </div>
        );
      })}
      {!monthly && (
        <button type="button" className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
          disabled={busy || rows.length >= max}
          onClick={() => batch ? picker.current?.click() : onChange([...rows, blankMedia()])}>
          {busy ? t("جارٍ رفع الملفات…", "Uploading files…") : batch ? t("+ إضافة ملفات", "+ Add files") : t("+ إضافة رابط", "+ Add link")}
          { ` (${rows.length}/${max})` }
        </button>
      )}
      {errors.length > 0 && (
        <ul className={s.mediaErrors} role="alert">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul>
      )}
    </div>
  );
}

/* ---------- manual data form (tabs) ---------- */
function ManualForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
  wizard,
}: {
  initial: Draft;
  submitLabel: string;
  busy: boolean;
  onSubmit: (payload: Payload) => void;
  onCancel: () => void;
  wizard?: {
    draft: Draft;
    setDraft: React.Dispatch<React.SetStateAction<Draft>>;
    step: "source" | "details";
    uploading: boolean;
    onUploading: (value: boolean) => void;
  };
}) {
  const { t } = useLang();
  const [localDraft, setLocalDraft] = useState<Draft>(initial);
  const d = wizard?.draft ?? localDraft;
  const setD = wizard?.setDraft ?? setLocalDraft;
  const [tab, setTab] = useState<TabKey>("numbers");
  const [mediaUploading, setMediaUploading] = useState(false);
  const uploading = wizard?.uploading ?? mediaUploading;
  const onUploading = wizard?.onUploading ?? setMediaUploading;
  const a = analyze(d, t);
  const errTabs = new Set(a.errors.map((e) => e.tab));

  const setNum = (i: number, patch: Partial<NumRow>) =>
    setD((p) => ({ ...p, numbers: p.numbers.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const tabs: { key: TabKey; label: string; count: string; ok?: boolean }[] = [
    { key: "numbers", label: t("الأرقام", "Numbers"), count: `${a.counts.percents}/${MIN_PERCENTS}`, ok: a.counts.percents >= MIN_PERCENTS },
    { key: "report", label: t("التقرير الهندسي", "Engineering report"), count: `${a.counts.engineering}/3` },
    { key: "video", label: t("الفيديو الشهري", "Monthly video"), count: `${a.counts.video}/1` },
    { key: "ground", label: t("التصوير الأرضي", "Ground"), count: `${a.counts.ground}/${MAX_MEDIA}` },
    { key: "aerial", label: t("التصوير الجوي", "Aerial"), count: `${a.counts.aerial}/${MAX_MEDIA}` },
    { key: "photo", label: t("التصوير الفوتوغرافي", "Photography"), count: `${a.counts.photo}/${MAX_MEDIA}` },
    { key: "timelapse", label: t("التايم لابس", "Timelapse"), count: `${a.counts.timelapse}/${MAX_MEDIA}` },
  ];

  const listTab = (key: "ground" | "aerial" | "photo" | "timelapse") => (
    <MediaList key={key} rows={d[key]} onChange={(rows) => setD((p) => ({ ...p, [key]: rows }))}
      mode={key === "timelapse" ? "links" : "batch"} onUploading={onUploading} />
  );

  return (
    <div>
      {(!wizard || wizard.step === "source") && <div className={`${s.formSection} ${s.grid2}`}>
        <div>
          {wizard ? (
            <div className={s.wizardDate}>
              <div>
                <label className={s.label} htmlFor="phase-month">{t("الشهر", "Month")} *</label>
                <select id="phase-month" className={s.select} value={d.month.split("-")[1] ?? ""}
                  onChange={(e) => {
                    const month = e.target.value;
                    setD((p) => ({ ...p, month: `${p.month.split("-")[0] || new Date().getFullYear()}-${month}` }));
                  }}>
                  <option value="">{t("اختر الشهر", "Choose month")}</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = String(i + 1).padStart(2, "0");
                    const date = new Date(2020, i, 1);
                    return <option key={month} value={month}>{date.toLocaleDateString(t("ar-SA", "en"), { month: "long", calendar: "gregory" })}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className={s.label} htmlFor="phase-year">{t("السنة", "Year")} *</label>
                <input id="phase-year" className={s.input} dir="ltr" type="text" inputMode="numeric" maxLength={4}
                  placeholder={String(new Date().getFullYear())} value={d.month.split("-")[0]}
                  onChange={(e) => {
                    const year = e.target.value.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) & 15)).replace(/\D/g, "");
                    setD((p) => ({ ...p, month: `${year}-${p.month.split("-")[1] ?? ""}` }));
                  }} />
              </div>
            </div>
          ) : <>
            <label className={s.label}>{t("الشهر", "Month")} *</label>
            <input className={s.input} type="month" dir="ltr" placeholder="2025-09"
              value={d.month} onChange={(e) => setD((p) => ({ ...p, month: e.target.value }))} />
          </>}
        </div>
        <div>
          <label className={s.label}>{t("ملاحظة (اختياري)", "Note (optional)")}</label>
          <input
            className={s.input}
            type="text"
            value={d.originNote}
            onChange={(e) => setD((p) => ({ ...p, originNote: e.target.value }))}
          />
        </div>
      </div>}

      {(!wizard || wizard.step === "details") && <>
      <div className={s.tabBar} role="tablist">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={tab === x.key}
            disabled={uploading}
            className={`${s.tabBtn} ${tab === x.key ? s.tabActive : ""}`}
            onClick={() => setTab(x.key)}
          >
            {x.label}
            <span className={`${s.tabCount} ${x.ok ? s.tabCountOk : ""}`}>{x.count}</span>
            {errTabs.has(x.key) && <span className={s.tabDot} aria-label="error" />}
          </button>
        ))}
      </div>

      <div className={s.formSection}>
        {tab === "numbers" && (
          <div>
            <p className={s.note} style={{ marginTop: 0, marginBottom: 10 }}>
              {t(
                `الصفوف الفاضية بتتجاهل. لازم ${MIN_PERCENTS} نسب مئوية على الأقل (من 0 لـ 100).`,
                `Empty rows are ignored. At least ${MIN_PERCENTS} percentages are required (0 to 100).`,
              )}
            </p>
            {d.numbers.map((c, i) => (
              <div key={i} className={s.row}>
                <input
                  className={s.input}
                  type="text"
                  placeholder={t("الاسم", "Name")}
                  value={c.name}
                  onChange={(e) => setNum(i, { name: e.target.value })}
                />
                <select
                  className={s.select}
                  value={c.type}
                  onChange={(e) => setNum(i, { type: e.target.value as "number" | "percent" })}
                >
                  <option value="percent">{t("نسبة %", "Percent %")}</option>
                  <option value="number">{t("رقم", "Number")}</option>
                </select>
                <input
                  className={`${s.input} ${s.rowValue}`}
                  type="text"
                  inputMode="decimal"
                  placeholder={c.type === "percent" ? "0 - 100" : t("القيمة", "Value")}
                  value={c.value}
                  onChange={(e) => setNum(i, { value: e.target.value })}
                />
                <button
                  type="button"
                  className={s.iconBtn}
                  aria-label="remove"
                  disabled={d.numbers.length <= 1}
                  onClick={() => setD((p) => ({ ...p, numbers: p.numbers.filter((_, j) => j !== i) }))}
                >
                  ×
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                onClick={() => setD((p) => ({ ...p, numbers: [...p.numbers, blankNum("percent")] }))}
              >
                + {t("نسبة", "Percent")}
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                onClick={() => setD((p) => ({ ...p, numbers: [...p.numbers, blankNum("number")] }))}
              >
                + {t("رقم", "Number")}
              </button>
            </div>
          </div>
        )}

        {tab === "report" && (
          <div>
            <p className={s.note} style={{ marginTop: 0, marginBottom: 10 }}>
              {t("كل الحقول اختيارية. اللي تسيبه فاضي مش هيظهر.", "All fields are optional. Empty ones are not shown.")}
            </p>
            {(
              [
                ["notes", t("ملاحظات", "Notes")],
                ["reading", t("قراءة الإنجاز", "Progress reading")],
                ["upcoming", t("المراحل القادمة المتوقعة", "Expected upcoming phases")],
              ] as const
            ).map(([key, label]) => (
              <fieldset key={key} className={s.reportLanguages}>
                <legend>{label}</legend>
                {(["ar", "en"] as const).map((language) => {
                  const field = language === "ar" ? key : `${key}En` as "notesEn" | "readingEn" | "upcomingEn";
                  const id = `report-${field}`;
                  return (
                    <div key={language}>
                      <label className={s.label} htmlFor={id}>{language === "ar" ? t("العربية", "Arabic") : t("الإنجليزية", "English")}</label>
                      <textarea id={id} className={s.textarea} rows={4} dir={language === "ar" ? "rtl" : "ltr"} lang={language}
                        value={d[field]} maxLength={MAX_TEXT}
                        onChange={(e) => setD((previous) => ({ ...previous, [field]: e.target.value }))} />
                      <div className={s.coverHint}>{d[field].trim().length}/{MAX_TEXT}</div>
                    </div>
                  );
                })}
              </fieldset>
            ))}
          </div>
        )}

        {tab === "video" && (
          <div>
            {d.droppedVideos > 0 && (
              <div className={s.notice}>
                {t(
                  `السجل القديم ده فيه ${d.droppedVideos} فيديو إضافي. الفيديو الشهري بقى واحد بس، فالإضافي هيتشال لما تحفظ.`,
                  `This older record has ${d.droppedVideos} extra video(s). The monthly video is now a single one, so the extra ones are dropped on save.`,
                )}
              </div>
            )}
            <p className={s.note} style={{ marginTop: 0, marginBottom: 10 }}>
              {t("فيديو واحد اختياري: لينك (يوتيوب، درايف...) أو ملف فيديو مرفوع.", "One optional video: a link (YouTube, Drive...) or an uploaded video file.")}
            </p>
            <MediaList rows={[d.video]} onChange={(rows) => setD((p) => ({ ...p, video: rows[0] }))} mode="monthly" onUploading={onUploading} />
          </div>
        )}

        {tab === "ground" && listTab("ground")}
        {tab === "aerial" && listTab("aerial")}
        {tab === "photo" && listTab("photo")}
        {tab === "timelapse" && listTab("timelapse")}
      </div>

      </>}

      {!wizard && <div className={s.formFoot}>
        {a.errors.length > 0 ? (
          <ul className={s.errors}>
            {a.errors.slice(0, 3).map((e, i) => (
              <li key={i}>
                <button type="button" className={s.errLink} disabled={uploading} onClick={() => setTab(e.tab)}>
                  {e.msg}
                </button>
              </li>
            ))}
            {a.errors.length > 3 && (
              <li>{t(`و ${a.errors.length - 3} ملاحظات أخرى`, `and ${a.errors.length - 3} more`)}</li>
            )}
          </ul>
        ) : (
          <span className={s.note} style={{ margin: 0 }}>
            {t("البيانات مكتملة", "Everything is filled in")} ✓
          </span>
        )}
        <div className={s.formFootBtns}>
          <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={onCancel}>
            {t("إلغاء", "Cancel")}
          </button>
          <button
            type="button"
            className={`${s.btn} ${s.btnPrimary}`}
            disabled={busy || uploading || a.errors.length > 0}
            onClick={() => onSubmit(a.payload)}
          >
            {busy ? t("جاري الحفظ...", "Saving...") : submitLabel}
          </button>
        </div>
      </div>}
    </div>
  );
}

type PhaseStep = "cover" | "source" | "details" | "review";

function PhaseWizard({
  freeRecords,
  busy,
  phase,
  monthly,
  onSubmit,
  onClose,
}: {
  freeRecords: MonthlyRecord[];
  busy: boolean;
  phase?: Phase;
  monthly?: MonthlyRecord;
  onSubmit: (body: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const { t, fmtMonth } = useLang();
  const [step, setStep] = useState<PhaseStep>(monthly ? "source" : "cover");
  const [cover, setCover] = useState(phase?.coverImage ?? "");
  const [uploading, setUploading] = useState(false);
  const editableRecord = monthly ?? (phase?.monthlyData.source === "MANUAL" ? phase.monthlyData : undefined);
  const [mode, setMode] = useState<"existing" | "manual" | "edit">(
    editableRecord ? "edit" : phase || freeRecords.length ? "existing" : "manual",
  );
  const [selected, setSelected] = useState<number | null>(phase?.monthlyData.id ?? null);
  const [isLatest, setIsLatest] = useState(phase?.isLatest ?? false);
  const [newDraft, setNewDraft] = useState(emptyDraft);
  const [originalDraft] = useState(() => editableRecord ? draftFromRecord(editableRecord) : emptyDraft());
  const [editedDraft, setEditedDraft] = useState(originalDraft);
  const editingRecord = mode === "edit";
  const hasDetails = mode !== "existing";
  const editingUnchanged = editingRecord && editedDraft === originalDraft;
  const draft = editingRecord ? editedDraft : newDraft;
  const setDraft = editingRecord ? setEditedDraft : setNewDraft;
  const [attempted, setAttempted] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const analysis = analyze(draft, t);
  const currentRecord = phase && {
    ...phase.monthlyData,
    externalProjectId: null,
    phase: { id: phase.id, isLatest: phase.isLatest },
  };
  const availableRecords = currentRecord ? [currentRecord, ...freeRecords] : freeRecords;
  const record = availableRecords.find((item) => item.id === selected);
  const keepingRecord = !!currentRecord && record?.id === currentRecord.id;
  const steps: PhaseStep[] = monthly ? ["source", "details", "review"] : hasDetails
    ? ["cover", "source", "details", "review"]
    : ["cover", "source", "review"];
  const current = steps.indexOf(step);
  const labels = {
    cover: t("صورة المرحلة", "Cover image"),
    source: monthly ? t("بيانات السجل", "Record information") : t("مصدر البيانات", "Data source"),
    details: t("تفاصيل الإنجاز", "Progress details"),
    review: t("المراجعة", "Review"),
  };
  const descriptions = {
    cover: t("اختر الصورة التي ستظهر مع المرحلة في الجدول الزمني.", "Choose the image shown with this phase on the timeline."),
    source: monthly
      ? t("راجع الشهر والملاحظة قبل تعديل تفاصيل الإنجاز.", "Review the month and note before editing progress details.")
      : t("اختر تعديل السجل الحالي إن كان يدويًا، أو اربط سجلًا آخر أو أضف بيانات جديدة.", "Edit the current manual record, link another record, or add new data."),
    details: t("أدخل ثلاث نسب إنجاز على الأقل. يمكنك إضافة تقرير هندسي ووسائط من الأقسام أدناه.", "Enter at least three progress percentages. You can add an engineering report and media below."),
    review: monthly
      ? t("راجع تفاصيل السجل قبل حفظ التعديلات.", "Review the record before saving.")
      : phase
      ? t("راجع صورة المرحلة والسجل المختار قبل حفظ التعديلات.", "Review the phase cover and selected record before saving.")
      : t("راجع الصورة والشهر والبيانات قبل إنشاء المرحلة.", "Check the cover, month, and data before creating the phase."),
  };
  const issues = {
    cover: isImageLink(cover) ? [] : [t("أضف صورة للمرحلة للمتابعة.", "Add a phase cover image to continue.")],
    source: mode === "existing"
      ? record ? [] : [t("اختر سجلًا للمتابعة.", "Choose a record to continue.")]
      : MONTH_RE.test(draft.month) ? [] : [t("اختر شهر المرحلة.", "Choose the phase month.")],
    details: editingUnchanged ? [] : analysis.errors.map((error) => error.msg),
    review: [],
  };
  const stepIssues = issues[step];

  function go(next: PhaseStep) {
    setAttempted(false);
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }

  function next() {
    if (stepIssues.length) {
      setAttempted(true);
      heading.current?.focus();
      return;
    }
    go(steps[current + 1]);
  }

  function submit() {
    const invalid = steps.find((item) => issues[item].length);
    if (invalid) {
      go(invalid);
      setAttempted(true);
      return;
    }
    if (monthly) {
      if (editingUnchanged) onClose();
      else onSubmit(analysis.payload);
      return;
    }
    onSubmit({
      coverImage: cover.trim(),
      ...(!phase || isLatest !== phase.isLatest ? { isLatest } : {}),
      ...(editingRecord && !editingUnchanged && editableRecord
        ? { manualUpdate: { id: editableRecord.id, data: analysis.payload } }
        : mode === "manual" ? { manual: analysis.payload }
        : record && !keepingRecord ? { monthlyDataId: record.id } : {}),
    });
  }

  const title = monthly
    ? t(`تعديل سجل ${fmtMonth(monthly.month)}`, `Edit record ${fmtMonth(monthly.month)}`)
    : phase
    ? t(`تعديل مرحلة ${fmtMonth(phase.monthlyData.month)}`, `Edit phase ${fmtMonth(phase.monthlyData.month)}`)
    : t("إنشاء مرحلة جديدة", "Create a new phase");
  const saveLabel = phase || monthly ? t("حفظ التعديلات", "Save changes") : t("إنشاء المرحلة", "Create phase");

  return (
    <Modal title={title} onClose={() => { if (!busy) onClose(); }}
      strict size="wizard"
      footer={
        <div className={s.wizardActions}>
          <button type="button" className={`${s.btn} ${s.btnGhost}`} disabled={busy} onClick={onClose}>
            {t("إلغاء", "Cancel")}
          </button>
          <div>
            {current > 0 && (
              <button type="button" className={`${s.btn} ${s.btnGhost}`} disabled={busy || uploading} onClick={() => go(steps[current - 1])}>
                {t("السابق", "Back")}
              </button>
            )}
            <button type="button" className={`${s.btn} ${s.btnPrimary}`}
              disabled={busy || uploading} onClick={step === "review" ? submit : next}>
              {busy ? t("جاري الحفظ…", "Saving…") : step === "review" ? saveLabel : t("التالي", "Next")}
            </button>
          </div>
        </div>
      }>
      <ol className={s.wizardSteps} aria-label={t("خطوات المرحلة", "Phase steps")}>
        {steps.map((item, index) => (
          <li key={item} aria-current={item === step ? "step" : undefined} data-complete={index < current}>
            <span>{index + 1}</span>{labels[item]}
          </li>
        ))}
      </ol>
      <section className={s.wizardPanel} aria-labelledby="phase-step-heading">
        <h4 id="phase-step-heading" ref={heading} tabIndex={-1}>{labels[step]}</h4>
        <p className={s.wizardHint}>{descriptions[step]}</p>
        {attempted && stepIssues.length > 0 && (
          <ul className={s.wizardErrors} role="alert">{stepIssues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
        )}
        {step === "cover" && (
          <CoverField value={cover} onChange={setCover} onUploading={setUploading} />
        )}
        {step === "source" && !monthly && (
          <div className={s.wizardSource}>
            <Segmented value={mode} onChange={(value) => { setMode(value); setAttempted(false); }} options={[
              ...(editableRecord ? [{ value: "edit" as const, label: t("تعديل تفاصيل السجل الحالي", "Edit current record details") }] : []),
              { value: "existing", label: t("سجل موجود", "Existing record") },
              { value: "manual", label: t("بيانات يدوية جديدة", "New manual data") },
            ]} />
            {mode === "existing" && <RecordPicker records={availableRecords} value={selected} onChange={setSelected}
              onManual={() => { setMode("manual"); setAttempted(false); }} />}
          </div>
        )}
        {hasDetails && (step === "source" || step === "details") && (
          <ManualForm initial={draft} busy={busy} submitLabel="" onCancel={onClose}
            onSubmit={(payload) => onSubmit({ manual: payload, coverImage: cover.trim(), isLatest })}
            wizard={{ draft, setDraft, step, uploading, onUploading: setUploading }} />
        )}
        {step === "review" && (
          <>
            <div className={s.wizardReview}>
              {!monthly && <div className={s.wizardReviewImage} role="img" aria-label={labels.cover}
                style={{ backgroundImage: `url(${JSON.stringify(cover.trim())})` }} />}
              <dl>
                <dt>{t("الشهر", "Month")}</dt>
                <dd>{fmtMonth(hasDetails ? draft.month : record?.month ?? "")}</dd>
                <dt>{labels.source}</dt>
                <dd>{editingRecord ? t("السجل اليدوي الحالي", "Current manual record") : mode === "manual" ? t("بيانات يدوية جديدة", "New manual data") : keepingRecord ? t("السجل الحالي", "Current record") : t("سجل موجود", "Existing record")}</dd>
                {hasDetails && <>
                  <dt>{t("نسب الإنجاز", "Progress percentages")}</dt>
                  <dd>{analysis.counts.percents}</dd>
                  <dt>{t("الوسائط المضافة", "Media items added")}</dt>
                  <dd>{analysis.counts.video + analysis.counts.ground + analysis.counts.aerial + analysis.counts.photo + analysis.counts.timelapse}</dd>
                </>}
              </dl>
            </div>
            {!monthly && <label className={s.wizardLatest}>
              <input type="checkbox" checked={isLatest} onChange={(e) => setIsLatest(e.target.checked)} />
              {t("تعيين المرحلة كأحدث تقرير", "Set this phase as the latest report")}
            </label>}
          </>
        )}
      </section>
    </Modal>
  );
}

/* ---------- phase cover image (required, image only): upload or link ---------- */
function CoverField({
  value,
  onChange,
  onUploading,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploading?: (value: boolean) => void;
}) {
  const { t } = useLang();
  const [uploading, setUploading] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const pick = async (file: File) => {
    setLocalErr(null);
    const bad = checkFile(file, "image", t);
    if (bad) {
      setLocalErr(bad);
      return;
    }
    setUploading(true);
    onUploading?.(true);
    const r = await uploadFile(file);
    setUploading(false);
    onUploading?.(false);
    if ("url" in r) onChange(r.url);
    else setLocalErr(r.error);
  };

  // live: a link that is not an image is refused while typing, not only on save
  const shown = localErr || (value.trim() && !isImageLink(value) ? t(COVER_HELP, COVER_HELP_EN) : null);

  return (
    <div className={s.formSection}>
      <label className={s.label}>{t("صورة المرحلة", "Phase cover image")} *</label>
      <div className={s.coverBox}>
        <div className={s.coverPreview} style={isImageLink(value) ? { backgroundImage: `url(${JSON.stringify(value.trim())})` } : undefined}>
          {!isImageLink(value) && (uploading ? t("جاري الرفع...", "Uploading...") : t("لا توجد صورة", "No image"))}
        </div>
        <div className={s.coverFields}>
          <input
            className={s.input}
            dir="ltr"
            placeholder="https://.../image.jpg"
            value={value}
            onChange={(e) => {
              setLocalErr(null);
              onChange(e.target.value.trim());
            }}
          />
          <div>
            <label className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}>
              {uploading ? t("جاري الرفع...", "Uploading...") : t("رفع صورة من الجهاز", "Upload from device")}
              <input
                type="file"
                accept={IMG_ACCEPT}
                hidden
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pick(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>
      {shown && <div className={s.fieldError}>{shown}</div>}
      <div className={s.coverHint}>
        {t(
          "إجباري، وصورة فقط. ارفع صورة (حتى 10MB) أو حط لينك صورة مباشر ينتهي بـ jpg / png / webp / gif.",
          "Required, image only. Upload an image (up to 10MB) or paste a direct image link ending in jpg / png / webp / gif.",
        )}
      </div>
    </div>
  );
}

/* ---------- page ---------- */
type ModalState =
  | { kind: "addPhase" }
  | { kind: "changeRecord"; phase: Phase }
  | { kind: "record"; record: MonthlyRecord | null }
  | null;
type ConfirmState = { title: string; text: string; confirmLabel: string; onConfirm: () => Promise<void> } | null;

export default function ProjectTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const locale = useLocale();
  const isRTL = locale === "ar";
  const base = `/api/admin/projects/${id}`;

  const lang = useMemo(() => {
    const t = (ar: string, en: string) => (isRTL ? ar : en);
    const fmtMonth = (m: string) => {
      const [y, mo] = m.split("-").map(Number);
      if (!y || !mo) return m;
      return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString(isRTL ? "ar-EG-u-nu-latn" : "en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    };
    return { t, fmtMonth };
  }, [isRTL]);
  const { t, fmtMonth } = lang;

  const [projectName, setProjectName] = useState("");
  const [linked, setLinked] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Msg | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [recFilter, setRecFilter] = useState<"all" | Source | "free">("all");

  const dismissToast = useCallback(() => setToast(null), []);

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t("حدث خطأ", "Something went wrong"));
    return data;
  };

  const load = useCallback(async () => {
    try {
      const [p, ph, rec] = await Promise.all([
        fetch(`/api/projects/${id}`).then((r) => r.json()),
        fetch(`/api/admin/projects/${id}/phases`).then((r) => r.json()),
        fetch(`/api/admin/projects/${id}/monthly`).then((r) => r.json()),
      ]);
      const project = p.project || p;
      setProjectName((isRTL ? project.nameAr : project.nameEn || project.nameAr) || "");
      setLinked(!!project.externalProjectId);
      setPhases(Array.isArray(ph) ? ph : []);
      setRecords(Array.isArray(rec) ? rec : []);
    } catch {
      setToast({ type: "error", text: t("تعذر تحميل البيانات", "Could not load the data") });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isRTL]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setToast(null);
    try {
      await fn();
      setToast({ type: "success", text: okText });
      await load();
      return true;
    } catch (e) {
      setToast({ type: "error", text: e instanceof Error ? e.message : t("حدث خطأ", "Something went wrong") });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const sortedPhases = useMemo(
    () => [...phases].sort((a, b) => b.monthlyData.month.localeCompare(a.monthlyData.month) || b.id - a.id),
    [phases],
  );
  const freeRecords = records.filter((r) => !r.phase);
  const shownRecords = records.filter((r) =>
    recFilter === "all" ? true : recFilter === "free" ? !r.phase : r.source === recFilter,
  );

  /* ----- actions ----- */
  const createPhase = async (body: Record<string, unknown>) => {
    if (await run(() => call(`${base}/phases`, "POST", body), t("تم إنشاء المرحلة", "Phase created"))) setModal(null);
  };

  const changePhaseRecord = async (phaseId: number, body: Record<string, unknown>) => {
    if (await run(() => call(`${base}/phases/${phaseId}`, "PUT", body), t("تم تعديل المرحلة", "Phase updated"))) {
      setModal(null);
    }
  };

  const toggleLatest = (p: Phase) =>
    run(
      () => call(`${base}/phases/${p.id}`, "PUT", { isLatest: !p.isLatest }),
      p.isLatest ? t("تم إلغاء علامة أحدث تقرير", "Latest-report tag removed") : t("تم تحديد المرحلة كأحدث تقرير", "Marked as the latest report"),
    );

  const saveRecord = async (record: MonthlyRecord | null, payload: Payload) => {
    const ok = await run(
      () => (record ? call(`${base}/monthly/${record.id}`, "PUT", payload) : call(`${base}/monthly`, "POST", payload)),
      t("تم حفظ السجل", "Record saved"),
    );
    if (ok) setModal(null);
  };

  const askRemovePhase = (p: Phase) =>
    setConfirm({
      title: t("مسح المرحلة", "Delete phase"),
      text: t(
        `هيتم مسح مرحلة ${fmtMonth(p.monthlyData.month)}. السجل الشهري هيفضل موجود ويبقى متاح لمرحلة تانية.`,
        `The ${fmtMonth(p.monthlyData.month)} phase will be deleted. Its monthly record stays and becomes free.`,
      ),
      confirmLabel: t("مسح", "Delete"),
      onConfirm: async () => {
        await run(() => call(`${base}/phases/${p.id}`, "DELETE"), t("تم مسح المرحلة", "Phase deleted"));
        setConfirm(null);
      },
    });

  const canDeleteRecord = (r: MonthlyRecord) => !r.phase && (r.source === "MANUAL" || !linked);
  const deleteReason = (r: MonthlyRecord) =>
    r.phase
      ? t(
          `مستخدم في مرحلة ${fmtMonth(r.month)}. غيّر سجل المرحلة الأول.`,
          `Used by the ${fmtMonth(r.month)} phase. Change that phase's record first.`,
        )
      : r.source === "COLORIDEA" && linked
        ? t("سجل متزامن من ColorIdea. فك ربط المشروع الأول.", "Synced from ColorIdea. Unlink the project first.")
        : "";

  const askRemoveRecord = (r: MonthlyRecord) =>
    setConfirm({
      title: t("مسح السجل", "Delete record"),
      text: t(`هيتم مسح سجل ${fmtMonth(r.month)}.`, `The ${fmtMonth(r.month)} record will be deleted.`),
      confirmLabel: t("مسح", "Delete"),
      onConfirm: async () => {
        await run(() => call(`${base}/monthly/${r.id}`, "DELETE"), t("تم مسح السجل", "Record deleted"));
        setConfirm(null);
      },
    });

  if (loading) {
    return <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading...</div>;
  }

  return (
    <LangCtx.Provider value={lang}>
      <div>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>
              {t("الجدول الزمني", "Timeline")}: {projectName}
            </h1>
            <div className={s.sub}>
              <span className={`${s.pill} ${linked ? s.pillLinked : s.pillUnlinked}`}>
                {linked ? t("مربوط بـ ColorIdea", "Linked to ColorIdea") : t("غير مربوط بـ ColorIdea", "Not linked to ColorIdea")}
              </span>
            </div>
          </div>
          <Link href={`/${locale}/admin/projects/${id}/edit`} className={`${s.btn} ${s.btnGhost}`}>
            {isRTL ? "→" : "←"} {t("رجوع لتعديل المشروع", "Back to the project")}
          </Link>
        </div>

        <div className={s.stats}>
          <div className={s.stat}>
            <div><div className={s.statNum}>{phases.length}</div>
            <div className={s.statLabel}>{t("مراحل", "Phases")}</div></div>
            <span className={s.statIcon}><Milestone size={22} strokeWidth={1.6} aria-hidden="true" /></span>
          </div>
          <div className={s.stat}>
            <div><div className={s.statNum}>{records.length}</div>
            <div className={s.statLabel}>{t("سجلات شهرية", "Monthly records")}</div></div>
            <span className={s.statIcon}><CalendarDays size={22} strokeWidth={1.6} aria-hidden="true" /></span>
          </div>
          <div className={s.stat}>
            <div><div className={s.statNum}>{freeRecords.length}</div>
            <div className={s.statLabel}>{t("سجلات غير مستخدمة", "Unused records")}</div></div>
            <span className={s.statIcon}><Files size={22} strokeWidth={1.6} aria-hidden="true" /></span>
          </div>
        </div>

        <div className={s.layout}>
          {/* ====== PHASES ====== */}
          <div className={s.panel}>
            <div className={s.panelHead}>
              <h3 className={s.panelTitle}>
                {t("المراحل", "Phases")}
                <span className={s.count}>({phases.length})</span>
              </h3>
              <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => setModal({ kind: "addPhase" })}>
                + {t("إضافة مرحلة", "Add phase")}
              </button>
            </div>

            {sortedPhases.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyTitle}>{t("لا توجد مراحل بعد", "No phases yet")}</div>
                {t(
                  "المرحلة بتعرض بيانات شهر معين للزائر. أضف مرحلة من سجل موجود أو من بيانات يدوية.",
                  "A phase shows one month of data to visitors. Add one from an existing record or from manual data.",
                )}
              </div>
            ) : (
              <div className={s.timeline}>
                {sortedPhases.map((p) => {
                  const sm = summarize(p.monthlyData.report, p.monthlyData.outputs);
                  return (
                    <div key={p.id} className={`${s.phase} ${p.isLatest ? s.phaseLatest : ""}`}>
                      {p.coverImage && (
                        <div className={s.phaseCover} style={{ backgroundImage: `url(${JSON.stringify(p.coverImage)})` }} />
                      )}
                      <div className={s.phaseHead}>
                        <div>
                          <h4 className={s.phaseTitle}>{fmtMonth(p.monthlyData.month)}</h4>
                          <div className={s.badges}>
                            <SourceBadge source={p.monthlyData.source} />
                            {p.isLatest && <span className={`${s.badge} ${s.badgeLatest}`}>★ {t("أحدث تقرير", "Latest report")}</span>}
                          </div>
                        </div>
                        <div className={s.overall}>
                          <div className={s.overallNum}>{sm.overall !== null ? fmtPct(sm.overall) : "—"}</div>
                          <div className={s.overallLabel}>{t("الإجمالي الفعلي", "Overall progress")}</div>
                        </div>
                      </div>

                      {sm.overall !== null && (
                        <div className={s.bar}>
                          <div className={s.barFill} style={{ width: `${Math.min(100, Math.max(0, sm.overall))}%` }} />
                        </div>
                      )}

                      {sm.metrics.length > 0 && (
                        <div className={s.metrics}>
                          {sm.metrics.map((m) => (
                            <div key={m.name} className={s.metric}>
                              <div className={s.metricVal}>{fmtPct(m.value)}</div>
                              <div className={s.metricName} title={m.name}>
                                {m.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={s.meta}>
                        {metaLine(sm, t)}
                      </div>
                      {p.monthlyData.originNote && <div className={s.note}>{p.monthlyData.originNote}</div>}

                      <div className={s.actions}>
                        <button
                          type="button"
                          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                          disabled={busy}
                          onClick={() => toggleLatest(p)}
                        >
                          {p.isLatest ? t("إلغاء أحدث تقرير", "Remove latest tag") : `★ ${t("تحديد كأحدث تقرير", "Mark as latest")}`}
                        </button>
                        <button
                          type="button"
                          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                          disabled={busy}
                          onClick={() => setModal({ kind: "changeRecord", phase: p })}
                        >
                          {t("تعديل المرحلة", "Edit phase")}
                        </button>
                        <button
                          type="button"
                          className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}
                          disabled={busy}
                          onClick={() => askRemovePhase(p)}
                        >
                          {t("مسح", "Delete")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ====== RECORDS ====== */}
          <div className={s.panel}>
            <div className={s.panelHead}>
              <h3 className={s.panelTitle}>
                {t("السجلات الشهرية", "Monthly records")}
                <span className={s.count}>({records.length})</span>
              </h3>
              <button
                type="button"
                className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                onClick={() => setModal({ kind: "record", record: null })}
              >
                + {t("سجل يدوي", "Manual record")}
              </button>
            </div>

            {records.length > 0 && (
              <div className={s.chips}>
                {(
                  [
                    ["all", t("الكل", "All")],
                    ["free", t("غير مستخدم", "Unused")],
                    ["COLORIDEA", "ColorIdea"],
                    ["MANUAL", t("يدوي", "Manual")],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    className={`${s.chip} ${recFilter === k ? s.chipActive : ""}`}
                    onClick={() => setRecFilter(k)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {records.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyTitle}>{t("لا توجد سجلات بعد", "No records yet")}</div>
                {t(
                  "اربط المشروع بـ ColorIdea وزامن، أو أضف سجلًا يدويًا.",
                  "Link the project to ColorIdea and sync, or add a manual record.",
                )}
              </div>
            ) : shownRecords.length === 0 ? (
              <div className={s.empty}>{t("لا توجد نتائج", "No results")}</div>
            ) : (
              shownRecords.map((r) => {
                const sm = summarize(r.report, r.outputs);
                return (
                  <div key={r.id} className={s.record}>
                    <div className={s.recordTop}>
                      <span className={s.recordMonth}>{fmtMonth(r.month)}</span>
                      <span className={s.pickPct}>{sm.overall !== null ? fmtPct(sm.overall) : "—"}</span>
                    </div>
                    <div className={s.badges}>
                      <SourceBadge source={r.source} />
                      {r.phase ? (
                        <span className={`${s.badge} ${s.badgeUsed}`}>{t("مستخدم في مرحلة", "Used by a phase")}</span>
                      ) : (
                        <span className={s.badge}>{t("غير مستخدم", "Unused")}</span>
                      )}
                    </div>
                    <div className={s.note}>
                      {metaLine(sm, t)}
                      {r.originNote ? ` · ${r.originNote}` : ""}
                    </div>
                    <div className={s.recordActions}>
                      {r.source === "MANUAL" && (
                        <button
                          type="button"
                          className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                          disabled={busy}
                          onClick={() => setModal({ kind: "record", record: r })}
                        >
                          {t("تعديل", "Edit")}
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${s.btn} ${s.btnDanger} ${s.btnSm}`}
                        disabled={busy || !canDeleteRecord(r)}
                        title={deleteReason(r)}
                        onClick={() => askRemoveRecord(r)}
                      >
                        {t("مسح", "Delete")}
                      </button>
                    </div>
                    {!canDeleteRecord(r) && <div className={s.reason}>{deleteReason(r)}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ====== MODALS ====== */}
        {modal?.kind === "addPhase" && (
          <PhaseWizard
            freeRecords={freeRecords}
            busy={busy}
            onSubmit={createPhase}
            onClose={() => setModal(null)}
          />
        )}

        {modal?.kind === "changeRecord" && (
          <PhaseWizard
            key={modal.phase.id}
            freeRecords={freeRecords}
            busy={busy}
            phase={modal.phase}
            onSubmit={(body) => changePhaseRecord(modal.phase.id, body)}
            onClose={() => setModal(null)}
          />
        )}

        {modal?.kind === "record" && modal.record && (
          <PhaseWizard
            key={`monthly-${modal.record.id}`}
            freeRecords={[]}
            busy={busy}
            monthly={modal.record}
            onSubmit={(payload) => saveRecord(modal.record, payload as Payload)}
            onClose={() => setModal(null)}
          />
        )}

        {modal?.kind === "record" && !modal.record && (
          <Modal
            title={t("سجل يدوي جديد", "New manual record")}
            onClose={() => setModal(null)}
            size="wide"
            strict
          >
            <ManualForm
              initial={emptyDraft()}
              submitLabel={t("حفظ", "Save")}
              busy={busy}
              onSubmit={(payload) => saveRecord(null, payload)}
              onCancel={() => setModal(null)}
            />
          </Modal>
        )}

        {confirm && (
          <Modal
            title={confirm.title}
            size="sm"
            onClose={() => setConfirm(null)}
            footer={
              <>
                <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={() => setConfirm(null)} disabled={busy}>
                  {t("إلغاء", "Cancel")}
                </button>
                <button type="button" className={`${s.btn} ${s.btnDangerSolid}`} onClick={() => confirm.onConfirm()} disabled={busy}>
                  {busy ? "..." : confirm.confirmLabel}
                </button>
              </>
            }
          >
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#374151" }}>{confirm.text}</p>
          </Modal>
        )}

        {toast && <Toast msg={toast} onClose={dismissToast} />}
      </div>
    </LangCtx.Provider>
  );
}