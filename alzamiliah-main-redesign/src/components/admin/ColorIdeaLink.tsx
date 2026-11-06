"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmDialog, { ConfirmItem, ConfirmLead, ConfirmList } from "./ConfirmDialog";
import s from "./ColorIdeaLink.module.css";

interface Status {
  linked: boolean;
  externalProjectId: string | null;
  externalName: string | null;
  existsInColorIdea: boolean | null;
  lastSyncedAt: string | null;
  monthsCount: number;
  timelapseCount: number;
  phasesOnColorIdea: number;
  available: { id: string; name: string }[];
  remoteError: string | null;
}

type Msg = { type: "success" | "error" | "warning"; text: string } | null;
type Dialog = { kind: "unlink" } | { kind: "link"; phases: number } | null;

export default function ColorIdeaLink({ projectId, isRTL }: { projectId: string; isRTL: boolean }) {
  const t = (ar: string, en: string) => (isRTL ? ar : en);
  const base = `/api/admin/projects/${projectId}/coloridea`;

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"link" | "sync" | "unlink" | null>(null);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState<Msg>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(base);
      const data = await res.json();
      if (res.ok) setStatus(data);
      else setMessage({ type: "error", text: data.error || t("فشل التحميل", "Failed to load") });
    } catch {
      setMessage({ type: "error", text: t("خطأ في الاتصال بالسيرفر", "Network error") });
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  const link = async (confirm = false) => {
    setBusy("link");
    setMessage(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalProjectId: selected, confirm }),
      });
      const data = await res.json();

      if (res.status === 409 && data.needsConfirm) {
        setDialog({ kind: "link", phases: data.phases });
        setBusy(null);
        return;
      }

      setDialog(null);
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || t("فشل الربط", "Link failed") });
      } else {
        const r = data.result;
        setMessage({
          type: "success",
          text:
            r?.status === "synced"
              ? t(`تم الربط والمزامنة (${r.months} شهر)`, `Linked and synced (${r.months} months)`)
              : t("تم الربط", "Linked"),
        });
        setSelected("");
        await load();
      }
    } catch {
      setDialog(null);
      setMessage({ type: "error", text: t("خطأ في الاتصال بالسيرفر", "Network error") });
    }
    setBusy(null);
  };

  const syncNow = async () => {
    setBusy("sync");
    setMessage(null);
    try {
      const res = await fetch(`${base}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || t("فشلت المزامنة", "Sync failed") });
      } else if (data.result.status === "not_found") {
        setMessage({
          type: "warning",
          text: t(
            "المشروع ده مش موجود في ColorIdea حاليًا. الداتا المخزنة زي ما هي.",
            "This project no longer exists in ColorIdea. Stored data is unchanged.",
          ),
        });
      } else if (data.result.status === "empty") {
        setMessage({
          type: "warning",
          text: t(
            "ColorIdea رجّعت بيانات فاضية، فمفيش حاجة اتمسحت. الداتا المخزنة زي ما هي.",
            "ColorIdea returned no data, so nothing was deleted. Stored data is unchanged.",
          ),
        });
      } else {
        setMessage({
          type: "success",
          text: t(`تمت المزامنة (${data.result.months} شهر)`, `Synced (${data.result.months} months)`),
        });
      }
      await load();
    } catch {
      setMessage({ type: "error", text: t("خطأ في الاتصال بالسيرفر", "Network error") });
    }
    setBusy(null);
  };

  const unlink = async () => {
    setBusy("unlink");
    setMessage(null);
    try {
      const res = await fetch(base, { method: "DELETE" });
      const data = await res.json();
      setDialog(null);
      if (!res.ok) setMessage({ type: "error", text: data.error || t("فشل فك الربط", "Unlink failed") });
      else {
        setMessage({ type: "success", text: t("تم فك الربط", "Unlinked") });
        await load();
      }
    } catch {
      setDialog(null);
      setMessage({ type: "error", text: t("خطأ في الاتصال بالسيرفر", "Network error") });
    }
    setBusy(null);
  };

  return (
    <div className="admin-section">
      <h3>{t("الربط مع ColorIdea", "ColorIdea Link")}</h3>

      {loading ? (
        <div className={s.loading}>{t("جاري التحميل...", "Loading...")}</div>
      ) : !status ? null : (
        <>
          {status.remoteError && (
            <div className={`${s.box} ${s.warning}`}>
              {t("تعذر قراءة مشاريع ColorIdea: ", "Could not read ColorIdea projects: ")}
              {status.remoteError}
            </div>
          )}

          {status.linked ? (
            <>
              <div className={s.info}>
                <div className={s.name}>{status.externalName || status.externalProjectId}</div>
                {status.existsInColorIdea === false && (
                  <div className={`${s.box} ${s.warning}`} style={{ marginTop: 6 }}>
                    {t(
                      "المشروع ده مش موجود في ColorIdea حاليًا. الداتا المخزنة تاريخية.",
                      "This project no longer exists in ColorIdea. Stored data is history.",
                    )}
                  </div>
                )}
                <div className={s.meta}>
                  {t("آخر مزامنة: ", "Last synced: ")}
                  {status.lastSyncedAt
                    ? new Date(status.lastSyncedAt).toLocaleString(isRTL ? "ar-EG-u-nu-latn" : "en-US")
                    : t("لم تتم بعد", "never")}
                  <br />
                  {t(
                    `${status.monthsCount} شهر · ${status.timelapseCount} عنصر تايم لابس`,
                    `${status.monthsCount} months · ${status.timelapseCount} timelapse items`,
                  )}
                </div>
              </div>

              <button type="button" className={`${s.btn} ${s.btnGhost}`} onClick={syncNow} disabled={busy !== null}>
                {busy === "sync" ? t("جاري المزامنة...", "Syncing...") : t("🔄 مزامنة الآن", "🔄 Sync Now")}
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnDanger}`}
                onClick={() => setDialog({ kind: "unlink" })}
                disabled={busy !== null}
              >
                {t("فك الربط", "Unlink")}
              </button>
            </>
          ) : (
            <>
              <p className={s.hint}>
                {t(
                  "الربط اختياري. بعد الربط بتتسحب بيانات الأشهر والتايم لابس من ColorIdea.",
                  "Linking is optional. Monthly data and timelapse are pulled from ColorIdea.",
                )}
              </p>
              <label className={s.label}>{t("مشروع ColorIdea", "ColorIdea project")}</label>
              <select className={s.select} value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">{t("اختر مشروعًا", "Select a project")}</option>
                {status.available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`${s.btn} ${s.btnPrimary}`}
                onClick={() => link()}
                disabled={!selected || busy !== null}
              >
                {busy === "link" ? t("جاري الربط...", "Linking...") : t("ربط ومزامنة", "Link & Sync")}
              </button>
            </>
          )}

          {message && <div className={`${s.box} ${s[message.type]}`}>{message.text}</div>}
        </>
      )}

      {/* ---- unlink: explains exactly what stays and what stops ---- */}
      {dialog?.kind === "unlink" && status && (
        <ConfirmDialog
          title={t("فك الربط مع ColorIdea؟", "Unlink from ColorIdea?")}
          tone="warning"
          confirmLabel={t("فك الربط", "Unlink")}
          cancelLabel={t("إلغاء", "Cancel")}
          busy={busy === "unlink"}
          onConfirm={unlink}
          onCancel={() => setDialog(null)}
        >
          <ConfirmLead>
            {t("اقرأ اللي هيحصل قبل ما تكمل:", "Here is what will happen:")}
          </ConfirmLead>
          <ConfirmList>
            <ConfirmItem kind="keep">
              {t(
                `${status.monthsCount} شهر من بيانات ColorIdea هيفضلوا محفوظين كتاريخ.`,
                `${status.monthsCount} month(s) of ColorIdea data stay saved as history.`,
              )}
            </ConfirmItem>
            <ConfirmItem kind="keep">
              {status.phasesOnColorIdea > 0
                ? t(
                    `${status.phasesOnColorIdea} مراحل بتستخدم الداتا دي هتفضل شغالة زي ما هي.`,
                    `${status.phasesOnColorIdea} phase(s) using this data keep working unchanged.`,
                  )
                : t("المراحل مش هتتأثر.", "Your phases are not affected.")}
            </ConfirmItem>
            <ConfirmItem kind="stop">
              {t(
                "مش هتوصل أي تحديثات جديدة من ColorIdea بعد كده.",
                "No new updates will arrive from ColorIdea any more.",
              )}
            </ConfirmItem>
            <ConfirmItem kind="note">
              {t(
                "تقدر تربط المشروع تاني في أي وقت، بنفس المشروع أو بمشروع مختلف.",
                "You can link the project again at any time, to the same or a different project.",
              )}
            </ConfirmItem>
          </ConfirmList>
        </ConfirmDialog>
      )}

      {/* ---- link to a DIFFERENT ColorIdea project while phases use the old data ---- */}
      {dialog?.kind === "link" && (
        <ConfirmDialog
          title={t("الربط بمشروع مختلف", "Link to a different project")}
          tone="warning"
          confirmLabel={t("متابعة الربط", "Continue")}
          cancelLabel={t("إلغاء", "Cancel")}
          busy={busy === "link"}
          onConfirm={() => link(true)}
          onCancel={() => setDialog(null)}
        >
          <ConfirmLead>
            {t(
              `في ${dialog.phases} مراحل مربوطة ببيانات جاية من مشروع ColorIdea السابق.`,
              `${dialog.phases} phase(s) use data that came from the previous ColorIdea project.`,
            )}
          </ConfirmLead>
          <ConfirmList>
            <ConfirmItem kind="keep">
              {t(
                "المراحل دي هتفضل بنفس الأرقام والفيديوهات، وهتتحول بياناتها إلى «يدوي» مع ملاحظة بالأصل.",
                "Those phases keep the same numbers and videos; their data becomes “Manual” with an origin note.",
              )}
            </ConfirmItem>
            <ConfirmItem kind="stop">
              {t(
                "بيانات المشروع السابق غير المستخدمة في مراحل هتتمسح.",
                "Data of the previous project that no phase uses will be deleted.",
              )}
            </ConfirmItem>
            <ConfirmItem kind="note">
              {t("السجلات اليدوية ما بتتلمسش.", "Manual records are never touched.")}
            </ConfirmItem>
          </ConfirmList>
        </ConfirmDialog>
      )}
    </div>
  );
}