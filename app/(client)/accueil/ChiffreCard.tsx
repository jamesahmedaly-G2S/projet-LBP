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

const VARIANT_SUBTLE: Record<KpiVariant, string> = {
  ka: "text-white/85",
  kb: "text-white/85",
  kc: "text-white/85",
  kd: "text-ink/70",
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
    <div className={`rounded-2xl px-4 py-5 ${VARIANT_CLASSES[variant]}`}>
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <p
          className={`text-[11px] font-semibold tracking-wide uppercase ${VARIANT_SUBTLE[variant]}`}
        >
          {label}
        </p>
        <p className="mt-1.5 font-mono text-xl font-extrabold">{currentNote}</p>
        <p className={`mt-1 text-[11px] ${VARIANT_SUBTLE[variant]}`}>
          {open ? "Masquer l'historique" : "Historique →"}
        </p>
      </button>
      {open && (
        <table className="mt-2 w-full text-xs">
          <tbody>
            {history.map((h) => (
              <tr key={h.year} className={`border-t ${VARIANT_DIVIDER[variant]}`}>
                <td className={`py-1 ${VARIANT_SUBTLE[variant]}`}>{h.year}</td>
                <td className="py-1 text-right font-mono">{h.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
