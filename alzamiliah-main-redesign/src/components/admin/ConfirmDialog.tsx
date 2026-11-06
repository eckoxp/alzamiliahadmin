"use client";

import { useEffect, useId, useRef } from "react";
import s from "./ConfirmDialog.module.css";

type Tone = "info" | "warning" | "danger";

/** A friendlier replacement for window.confirm: icon, title, short text, a list of consequences. */
export default function ConfirmDialog({
  title,
  tone = "info",
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  tone?: Tone;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  const titleId = useId();
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelRef.current();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const confirmClass =
    tone === "danger" ? s.confirmDanger : tone === "warning" ? s.confirmWarning : s.confirmInfo;

  return (
    <div
      className={s.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className={s.dialog} role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={`${s.icon} ${s[tone]}`}>{tone === "info" ? "i" : "!"}</div>
        <h2 id={titleId} className={s.title}>
          {title}
        </h2>
        <div className={s.body}>{children}</div>
        <div className={s.foot}>
          <button type="button" className={`${s.btn} ${s.cancel}`} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={`${s.btn} ${confirmClass}`} onClick={onConfirm} disabled={busy}>
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** one line of a consequences list: keep (green ✓), stop (red ✕), note (grey •) */
export function ConfirmItem({ kind, children }: { kind: "keep" | "stop" | "note"; children: React.ReactNode }) {
  return (
    <li className={`${s.item} ${s[kind]}`}>
      <span className={s.mark}>{kind === "keep" ? "✓" : kind === "stop" ? "✕" : "•"}</span>
      <span>{children}</span>
    </li>
  );
}

export function ConfirmLead({ children }: { children: React.ReactNode }) {
  return <p className={s.lead}>{children}</p>;
}

export function ConfirmList({ children }: { children: React.ReactNode }) {
  return <ul className={s.list}>{children}</ul>;
}