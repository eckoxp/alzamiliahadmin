"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { EMBED_ALLOW, EMBED_SANDBOX, type MediaView } from "@/lib/embed";
import { metricLabel, monthLabel } from "@/lib/phaseLabels";
import type { MediaItem, PublicPhase } from "@/lib/publicTimeline";
import s from "./PhaseDetail.module.css";

/* ---------- labels ---------- */

const T = {
  ar: {
    home: "الرئيسية",
    report: "التقرير الشهري",
    latest: "أحدث تقرير",
    updated: "تحديث",
    total: "الإجمالي الفعلي",
    monthlyVideo: "الفيديو الشهري",
    engReport: "التقرير الهندسي",
    notes: "ملاحظات",
    reading: "قراءة الإنجاز",
    upcoming: "المراحل القادمة المتوقعة",
    overview: "نظرة عامة على الإنجاز",
    aerial: "التصوير الجوي",
    ground: "التصوير الأرضي",
    photo: "التصوير الفوتوغرافي",
    timelapse: "التايم لابس",
    info: "معلومات التقرير",
    project: "المشروع:",
    period: "فترة التقرير:",
    lastUpdate: "آخر تحديث:",
    allPhases: "عرض المشروع",
    sections: "أقسام التقرير",
    others: "التقارير والمراحل الأخرى",
    viewReport: "عرض التقرير",
    video: "فيديو",
    play: "تشغيل",
    close: "إغلاق",
    enlarge: "تكبير الصورة",
  },
  en: {
    home: "Home",
    report: "Monthly report",
    latest: "Latest report",
    updated: "Updated",
    total: "Overall progress",
    monthlyVideo: "Monthly video",
    engReport: "Engineering report",
    notes: "Notes",
    reading: "Progress reading",
    upcoming: "Expected upcoming phases",
    overview: "Progress overview",
    aerial: "Aerial photography",
    ground: "Ground photography",
    photo: "Photography",
    timelapse: "Time-lapse",
    info: "Report details",
    project: "Project:",
    period: "Report period:",
    lastUpdate: "Last update:",
    allPhases: "View project",
    sections: "Report sections",
    others: "Other reports & phases",
    viewReport: "View report",
    video: "Video",
    play: "Play",
    close: "Close",
    enlarge: "Enlarge image",
  },
} as const;

const fmtNum = (n: number) => String(Number(n.toFixed(2)));

function dateLabel(iso: string, isRTL: boolean): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(isRTL ? "ar-EG-u-nu-latn" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/* ---------- small pieces ---------- */

/** a video file or a whitelisted embed (YouTube / Vimeo / Drive file / Tikee) */
function Player({ view, title }: { view: MediaView; title: string }) {
  if (view.kind === "embed") {
    return (
      <div className={s.frame}>
        <iframe
          src={view.src}
          title={title}
          loading="lazy"
          allow={EMBED_ALLOW}
          sandbox={EMBED_SANDBOX}
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  return (
    <div className={s.frame}>
      <video src={view.src} controls playsInline preload="metadata" />
    </div>
  );
}

function Icon({ d }: { d: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}
const icons = {
  play: <><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5z" /></>,
  tools: <><path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  roadmap: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  building: <><path d="M5 21V4h9v17M14 9h5v12M3 21h18M8 8h3M8 12h3M8 16h3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

function Stat({ label, value, bar }: { label: string; value: number; bar: boolean }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={s.stat}>
      <strong>
        {fmtNum(value)}
        {bar ? "%" : ""}
      </strong>
      <small>{label}</small>
      {bar && (
        <div className={s.bar} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: shown ? `${pct}%` : 0 }} />
        </div>
      )}
    </div>
  );
}

function Gallery({
  id,
  title,
  icon,
  items,
  onOpen,
  videoLabel,
  enlarge,
}: {
  id: string;
  title: string;
  icon: ReactNode;
  items: MediaItem[];
  onOpen: (v: MediaView, title: string) => void;
  videoLabel: string;
  enlarge: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className={s.card} id={id}>
      <h2>
        {icon}
        {title}
      </h2>
      <div className={s.gallery}>
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            className={s.tile}
            aria-label={it.view.kind === "image" ? `${enlarge} ${i + 1}` : `${videoLabel} ${i + 1}`}
            onClick={() => onOpen(it.view, title)}
          >
            {it.view.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.view.src} alt={it.name || `${title} ${i + 1}`} loading="lazy" />
            ) : (
              <span className={s.videoTile}>
                <span className={s.playDot}>
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className={s.videoName}>{it.name || `${videoLabel} ${i + 1}`}</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function Lightbox({ view, title, onClose, closeLabel }: { view: MediaView; title: string; onClose: () => void; closeLabel: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className={s.lightbox} role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <button type="button" className={s.lightboxClose} onClick={onClose} aria-label={closeLabel}>
        ×
      </button>
      <div className={s.lightboxBody} onClick={(e) => e.stopPropagation()}>
        {view.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view.src} alt={title} />
        ) : (
          <Player view={view} title={title} />
        )}
      </div>
    </div>
  );
}

/* ---------- the page content ---------- */

export default function PhaseDetail({ data }: { data: PublicPhase }) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = isRTL ? T.ar : T.en;
  const { project, phase, others } = data;

  const [open, setOpen] = useState<{ view: MediaView; title: string } | null>(null);
  const openMedia = useCallback((view: MediaView, title: string) => setOpen({ view, title }), []);
  const closeMedia = useCallback(() => setOpen(null), []);

  const projectName = (isRTL ? project.nameAr : project.nameEn || project.nameAr) || project.nameAr;
  const period = monthLabel(phase.month, isRTL);
  const updated = dateLabel(phase.updatedAt, isRTL);
  const projectHref = `/${locale}/projects/${project.id}`;

  const hasReport = !!(phase.notes || phase.reading || phase.upcoming || phase.extraTexts.length);
  const hasOverview = phase.total !== null || phase.metrics.length > 0 || phase.numbers.length > 0;

  // only sections that really have data (they also feed the side menu)
  const sections = [
    phase.monthlyVideo && { id: "monthly-video", label: t.monthlyVideo, icon: icons.play },
    hasReport && { id: "report", label: t.engReport, icon: icons.building },
    hasOverview && { id: "overview", label: t.overview, icon: icons.chart },
    phase.aerial.length > 0 && { id: "aerial", label: t.aerial, icon: icons.camera },
    phase.ground.length > 0 && { id: "ground", label: t.ground, icon: icons.camera },
    phase.photo.length > 0 && { id: "photo", label: t.photo, icon: icons.camera },
    phase.timelapse && { id: "timelapse", label: t.timelapse, icon: icons.clock },
  ].filter(Boolean) as { id: string; label: string; icon: ReactNode }[];

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className={s.page}>
      {/* breadcrumb */}
      <div className="container">
        <nav className={s.crumbs} aria-label="breadcrumb">
          <Link href={`/${locale}`}>{t.home}</Link>
          <span>›</span>
          <Link href={projectHref}>{projectName}</Link>
          <span>›</span>
          <b>{period}</b>
        </nav>
      </div>

      {/* banner */}
      <div className="container">
        <section className={s.banner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={phase.coverImage} alt={projectName} />
          <div className={s.shade} />
          <div className={s.bannerContent}>
            <span className={s.bannerDate}>
              {t.report} · {period}
              {updated ? ` · ${t.updated} ${updated}` : ""}
            </span>
            <h1>{projectName}</h1>
            {phase.isLatest && <span className={s.latest}>{t.latest}</span>}
            {phase.total !== null && (
              <div className={s.bannerTotal}>
                <strong>
                  {fmtNum(phase.total)}
                  <small>%</small>
                </strong>
                <div>{t.total}</div>
              </div>
            )}
            {phase.metrics.length > 0 && (
              <div className={s.bannerMetrics}>
                {phase.metrics.map((m) => (
                  <div key={m.name}>
                    <span>{metricLabel(m.name, isRTL)}</span>
                    <strong>{fmtNum(m.value)}%</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="container">
        <div className={s.columns}>
          <div className={s.content}>
            {phase.monthlyVideo && (
              <section className={s.card} id="monthly-video">
                <h2>
                  <Icon d={icons.play} />
                  {t.monthlyVideo}
                </h2>
                <Player view={phase.monthlyVideo} title={t.monthlyVideo} />
              </section>
            )}

            {hasReport && (
              <section className={s.card} id="report">
                <h2>{t.engReport}</h2>
                {phase.notes && (
                  <div className={s.reportPart}>
                    <h3>
                      <Icon d={icons.tools} />
                      {t.notes}
                    </h3>
                    <p>{phase.notes}</p>
                  </div>
                )}
                {phase.reading && (
                  <div className={s.reportPart}>
                    <h3>
                      <Icon d={icons.chart} />
                      {t.reading}
                    </h3>
                    <p>{phase.reading}</p>
                  </div>
                )}
                {phase.upcoming && (
                  <div className={s.reportPart}>
                    <h3>
                      <Icon d={icons.roadmap} />
                      {t.upcoming}
                    </h3>
                    <p>{phase.upcoming}</p>
                  </div>
                )}
                {phase.extraTexts.map((x) => (
                  <div className={s.reportPart} key={x.name}>
                    <h3>
                      <Icon d={icons.building} />
                      {metricLabel(x.name, isRTL)}
                    </h3>
                    <p>{x.value}</p>
                  </div>
                ))}
              </section>
            )}

            {hasOverview && (
              <section className={s.card} id="overview">
                <h2>{t.overview}</h2>
                <div className={s.stats}>
                  {phase.total !== null && <Stat label={t.total} value={phase.total} bar />}
                  {phase.metrics.map((m) => (
                    <Stat key={m.name} label={metricLabel(m.name, isRTL)} value={m.value} bar />
                  ))}
                  {phase.numbers.map((m) => (
                    <Stat key={m.name} label={metricLabel(m.name, isRTL)} value={m.value} bar={false} />
                  ))}
                </div>
              </section>
            )}

            <Gallery id="aerial" title={t.aerial} icon={<Icon d={icons.camera} />} items={phase.aerial} onOpen={openMedia} videoLabel={t.video} enlarge={t.enlarge} />
            <Gallery id="ground" title={t.ground} icon={<Icon d={icons.camera} />} items={phase.ground} onOpen={openMedia} videoLabel={t.video} enlarge={t.enlarge} />
            <Gallery id="photo" title={t.photo} icon={<Icon d={icons.camera} />} items={phase.photo} onOpen={openMedia} videoLabel={t.video} enlarge={t.enlarge} />

            {phase.timelapse && (
              <section className={s.card} id="timelapse">
                <h2>
                  <Icon d={icons.clock} />
                  {t.timelapse}
                </h2>
                <Player view={phase.timelapse} title={t.timelapse} />
              </section>
            )}
          </div>

          <aside className={s.sidebar}>
            <section className={s.card}>
              <h2>{t.info}</h2>
              <dl className={s.info}>
                <div>
                  <dt>{t.project}</dt>
                  <dd>{projectName}</dd>
                </div>
                <div>
                  <dt>{t.period}</dt>
                  <dd>{period}</dd>
                </div>
                {updated && (
                  <div>
                    <dt>{t.lastUpdate}</dt>
                    <dd>{updated}</dd>
                  </div>
                )}
                {phase.total !== null && (
                  <div>
                    <dt>{t.total}:</dt>
                    <dd>{fmtNum(phase.total)}%</dd>
                  </div>
                )}
              </dl>
              <Link className={s.button} href={projectHref}>
                {t.allPhases}
              </Link>
            </section>

            {sections.length > 0 && (
              <section className={s.card}>
                <h2>{t.sections}</h2>
                <div className={s.links}>
                  {sections.map((x) => (
                    <button key={x.id} type="button" onClick={() => scrollTo(x.id)}>
                      <Icon d={x.icon} />
                      {x.label}
                      <span aria-hidden="true">{isRTL ? "‹" : "›"}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        {others.length > 0 && (
          <section className={s.others}>
            <h2>{t.others}</h2>
            <div className={s.othersGrid}>
              {others.map((o) => (
                <Link key={o.id} href={`/${locale}/projects/${project.id}/phases/${o.id}`} className={s.otherCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.coverImage} alt={projectName} loading="lazy" />
                  <div>
                    <span className={s.muted}>{projectName}</span>
                    <h3>{monthLabel(o.month, isRTL)}</h3>
                    {o.total !== null && <p>{fmtNum(o.total)}%</p>}
                    <span className={s.otherLink}>{t.viewReport} {isRTL ? "↖" : "↗"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {open && <Lightbox view={open.view} title={open.title} onClose={closeMedia} closeLabel={t.close} />}
    </div>
  );
}