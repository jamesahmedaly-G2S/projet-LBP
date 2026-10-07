"use client";

import { useState } from "react";

export interface KeyFigureHistory {
  year: number;
  note: string;
}

export type KpiVariant = "ka" | "kb" | "kc" | "kd";

// LBP-CLIENT-01 (finitions design, 01/10/2026) : 4 cartes chiffres clés en
// couleurs contrastées, portées 1:1 depuis le vrai prototype
// (LBP_V9.9_Studio.html, "COUCHE CHARTE G2S", .kpi-card.ka/kb/kc/kd) --
// remplace les cartes blanches neutres construites avant d'avoir vérifié le
// vrai rendu visuel. ka=carbone, kb=framboise, kc=framboise foncé (texte
// blanc les 3) ; kd=cream-3, seule variante à fond clair/texte carbone
// (`.kpi-card.kd *{color:var(--carbone)}` dans le vrai CSS).
const VARIANT_CLASSES: Record<KpiVariant, string> = {
  ka: "bg-ink text-white",
  kb: "bg-primary text-white",
  kc: "bg-primary-hover text-white",
  kd: "bg-[#efe7e1] text-ink",
};

// `.kc-sub{opacity:.85}` -- le libellé (`.kc-lab`) reste à pleine opacité.
const VARIANT_SUBTLE: Record<KpiVariant, string> = {
  ka: "text-white/85",
  kb: "text-white/85",
  kc: "text-white/85",
  kd: "text-ink/85",
};

const VARIANT_DIVIDER: Record<KpiVariant, string> = {
  ka: "border-white/20",
  kb: "border-white/20",
  kc: "border-white/20",
  kd: "border-ink/15",
};

export default function ChiffreCard({
  label,
  currentNote,
  history,
  variant = "ka",
}: {
  label: string;
  currentNote: string;
  history: KeyFigureHistory[];
  variant?: KpiVariant;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`cursor-pointer rounded-2xl px-[18px] py-4 transition-[transform,box-shadow] duration-[140ms] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(68,80,104,0.28)] ${VARIANT_CLASSES[variant]}`}
    >
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <p className="text-[11.5px] leading-[1.5] font-semibold tracking-[0.04em] uppercase">
          {label}
        </p>
        <p className="mt-1.5 mb-0.5 text-[23px] leading-[1.5] font-extrabold tabular-nums">
          {currentNote}
        </p>
        <p className={`text-[11.5px] leading-[1.5] ${VARIANT_SUBTLE[variant]}`}>
          {open ? "masquer l'historique" : "historique →"}
        </p>
      </button>
      {open && (
        <table className="mt-2 w-full text-xs">
          <tbody>
            {history.map((h) => (
              <tr key={h.year} className={`border-t ${VARIANT_DIVIDER[variant]}`}>
                <td className={`py-1 ${VARIANT_SUBTLE[variant]}`}>{h.year}</td>
                <td className="py-1 text-right tabular-nums">{h.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
