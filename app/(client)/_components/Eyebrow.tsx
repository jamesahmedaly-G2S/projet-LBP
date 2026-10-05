import type { ReactNode } from "react";

// Port 1:1 de .eyebrow -- correctif fidélité (03/10/2026), même audit que
// SectionTitle.tsx : le bloc "TITRES — renforcement demandé" (L.2472,
// plus tardif que la "COUCHE CHARTE G2S" L.2171) redéfinit aussi
// `.eyebrow` : font-size 11.5px (pas 11px), font-weight 800 (pas 700),
// letter-spacing .14em (pas .16em). Couleur inchangée (var(--sage-darker)
// = framboise, la MÊME teinte que les boutons -- jamais text-primary-hover,
// réservé au vrai état :hover des boutons, LBP-CLIENT-16).
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-display mb-1 text-[11.5px] font-extrabold tracking-[0.14em] text-primary uppercase">
      {children}
    </p>
  );
}
