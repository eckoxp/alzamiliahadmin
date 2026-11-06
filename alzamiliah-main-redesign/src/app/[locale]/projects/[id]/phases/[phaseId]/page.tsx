"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PhaseDetail from "@/components/PhaseDetail";
import type { PublicPhase } from "@/lib/publicTimeline";

type State = { kind: "loading" } | { kind: "notfound" } | { kind: "error" } | { kind: "ok"; data: PublicPhase };

export default function PhasePage() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const params = useParams<{ id: string; phaseId: string }>();
  const id = params?.id;
  const phaseId = params?.phaseId;
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!id || !phaseId) return;
    let alive = true;
    setState({ kind: "loading" });
    fetch(`/api/public/projects/${id}/phases/${phaseId}`)
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 404 || r.status === 400) return setState({ kind: "notfound" });
        if (!r.ok) return setState({ kind: "error" });
        setState({ kind: "ok", data: (await r.json()) as PublicPhase });
      })
      .catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [id, phaseId]);

  // the page title follows the project + month
  useEffect(() => {
    if (state.kind !== "ok") return;
    const { project, phase } = state.data;
    document.title = `${isRTL ? project.nameAr : project.nameEn || project.nameAr} · ${phase.month}`;
  }, [state, isRTL]);

  return (
    <>
      <Header forceWhite />
      <main style={{ paddingTop: "77px" }}>
        {state.kind === "ok" && <PhaseDetail data={state.data} />}
        {state.kind === "loading" && <div style={{ minHeight: "60vh" }} aria-busy="true" />}
        {(state.kind === "notfound" || state.kind === "error") && (
          <div className="container" style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <h2 style={{ marginBottom: 12 }}>
                {state.kind === "notfound"
                  ? isRTL
                    ? "هذا التقرير غير موجود"
                    : "This report was not found"
                  : isRTL
                    ? "تعذّر تحميل التقرير"
                    : "Could not load the report"}
              </h2>
              <Link href={id ? `/${locale}/projects/${id}` : `/${locale}`} style={{ color: "#bc8664", fontWeight: 700 }}>
                {isRTL ? "العودة إلى المشروع" : "Back to the project"}
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}