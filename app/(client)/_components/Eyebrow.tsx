import type { ReactNode } from "react";

// Port 1:1 de .eyebrow (LBP_V9.9_Studio.html, cascade finale L.2171 --
// "COUCHE CHARTE G2S", prime sur la règle L.120 plus haut dans le
// fichier) : font-size 11px, letter-spacing .16em, uppercase, weight 700,
// Archivo (body{font-family:'Archivo'}, L.68). color:var(--framboise) --
// la MÊME teinte que les boutons (--color-primary), pas une variante
// "hover" : jamais text-primary-hover ici, réservé au vrai état :hover
// des boutons (LBP-CLIENT-16, 30/09/2026).
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-display mb-1 text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
      {children}
    </p>
  );
}
