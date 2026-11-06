"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { metricLabel, monthLabel } from "@/lib/phaseLabels";
import type { PublicTimeline } from "@/lib/publicTimeline";
import s from "./ProjectTimeline.module.css";

const MAX_CARD_METRICS = 6;
const DRAG_THRESHOLD = 6;

/**
 * Loads the public timeline of a project (phases).
 * Returns null until it is loaded, or if it failed. The project page uses it to decide
 * if the "project phases" tab must be shown at all.
 */
export function useProjectTimeline(projectId: number | null): PublicTimeline | null {
  const [data, setData] = useState<PublicTimeline | null>(null);

  useEffect(() => {
    if (projectId === null) return;
    let alive = true;
    fetch(`/api/public/projects/${projectId}/timeline`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && Array.isArray(d.phases)) setData(d as PublicTimeline);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [projectId]);

  return data;
}

interface Props {
  data: PublicTimeline;
  projectId: number;
  projectName: string;
}

export default function ProjectTimeline({ data, projectId, projectName }: Props) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, moved: false, startX: 0, startScroll: 0 });
  const [dragging, setDragging] = useState(false);
  // the arrows only work when there is something to scroll to
  const [edge, setEdge] = useState({ canNewer: false, canOlder: false });

  const { phases } = data;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft); // distance from the start (right in Arabic, left in English)
      setEdge({ canNewer: max > 1 && pos > 6, canOlder: max > 1 && pos < max - 6 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [phases.length]);

  const t = (ar: string, en: string) => (isRTL ? ar : en);

  // "older" = the direction the page reads towards (left in Arabic, right in English)
  const scrollByCard = (older: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.min(396, el.clientWidth * 0.9);
    const toRight = isRTL ? !older : older;
    el.scrollBy({ left: toRight ? step : -step, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = { down: true, moved: false, startX: e.clientX, startScroll: el.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = trackRef.current;
    if (!d.down || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      d.moved = true;
      setDragging(true);
    }
    if (d.moved) el.scrollLeft = d.startScroll - dx;
  };
  const endDrag = () => {
    drag.current.down = false;
    setDragging(false);
  };
  // a drag must not open the card under the mouse
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const latest = phases[0];

  return (
    <section className={s.journey} dir={isRTL ? "rtl" : "ltr"}>
      {phases.length > 0 && (
        <>
          <div className={s.head}>
            <div>
              <div className={s.eyebrow}>
                {projectName} · {t("التقرير الشهري", "Monthly report")}
              </div>
              <h2>{t("الجدول الزمني للإنجاز", "Progress timeline")}</h2>
              <p>
                {t("الإنجاز الفعلي", "Actual progress")} · {monthLabel(latest.month, isRTL)}
              </p>
            </div>
            {phases.length > 0 && (
              <div className={s.arrows}>
                <button type="button" onClick={() => scrollByCard(false)} disabled={!edge.canNewer} aria-label={t("الأحدث", "Newer")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isRTL ? "" : s.flip}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
                <button type="button" onClick={() => scrollByCard(true)} disabled={!edge.canOlder} aria-label={t("الأقدم", "Older")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isRTL ? s.flip : ""}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div
            ref={trackRef}
            className={`${s.track} ${dragging ? s.dragging : ""}`}
            tabIndex={0}
            aria-label={t("تقارير الإنجاز", "Progress reports")}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onClickCapture={onClickCapture}
          >
            {phases.map((p) => {
              const label = monthLabel(p.month, isRTL);
              return (
                <Link
                  key={p.id}
                  href={`/${locale}/projects/${projectId}/phases/${p.id}`}
                  className={s.visit}
                  draggable={false}
                >
                  <span className={s.date}>{label}</span>
                  <article className={s.card}>
                    <div className={s.photo}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.coverImage} alt={`${projectName} - ${label}`} loading="lazy" draggable={false} />
                      {p.isLatest && <span className={s.badge}>{t("أحدث تقرير", "Latest report")}</span>}
                    </div>
                    <div className={s.body}>
                      <div className={s.top}>
                        <div>
                          <span className={s.muted}>
                            {t("التقرير الشهري", "Monthly report")} · {label}
                          </span>
                          <h3>{projectName}</h3>
                        </div>
                        {p.total !== null && (
                          <div className={s.totalBox}>
                            <div className={s.percentage}>
                              {p.total}
                              <small>%</small>
                            </div>
                            <span className={s.muted}>{t("الإجمالي الفعلي", "Overall progress")}</span>
                          </div>
                        )}
                      </div>
                      {p.total !== null && (
                        <div className={s.progress}>
                          <span style={{ width: `${Math.max(0, Math.min(100, p.total))}%` }} />
                        </div>
                      )}
                      {p.metrics.length > 0 && (
                        <div className={s.metrics}>
                          {p.metrics.slice(0, MAX_CARD_METRICS).map((m) => (
                            <div key={m.name}>
                              <span>{metricLabel(m.name, isRTL)}</span>
                              <b>{m.value}%</b>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={s.cardLink}>
                        <span>{t("استعرض تفاصيل التقرير", "View report details")}</span>
                        <span aria-hidden>{isRTL ? "↖" : "↗"}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </>
      )}

    </section>
  );
}