import { SquarePen } from "lucide-react";

// Éléments communs aux cartes de "Mon entreprise", mesurés sur la maquette
// (getComputedStyle, #v-documents, LBP_V9.9_Studio.html) :
// `.dash-card` = fond blanc, filet #DED9DB, rayon 16px, padding 18px 20px,
// ombre --shadow-sm ; `.sec-title.big` = 23px/800/-.015em #33405A, marge
// 6px 0 10px, icône SVG 18px alignée sur la ligne de base.
export const dashCardClass =
  "relative rounded-2xl border border-[#DED9DB] bg-white px-5 py-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]";

export const secTitleClass =
  "mt-[6px] mb-[10px] flex items-baseline gap-[10px] text-[23px] leading-[1.5] font-extrabold tracking-[-0.015em] text-[#33405A]";

// `.mod-edit.icon-btn` : bouton crayon (icône `edit` 15px) en haut à droite
// de la carte (top/right 12px depuis la bordure), gris --ink-soft,
// opacité .75 → 1 au survol. Positionné relativement à la zone de contenu
// de la carte (padding 18px 20px), d'où -6px/-8px.
export function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute -top-[6px] -right-[8px] z-[1] flex items-center rounded-[6px] p-1 leading-none text-[#6B656B] opacity-75 transition-colors hover:bg-[#F5F0EC] hover:text-ink hover:opacity-100"
    >
      <SquarePen className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
