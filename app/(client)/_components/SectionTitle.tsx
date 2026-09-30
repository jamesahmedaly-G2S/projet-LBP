import type { ReactNode } from "react";

// Port 1:1 de .section-title (LBP_V9.9_Studio.html, cascade finale
// L.2169 -- "COUCHE CHARTE G2S", prime sur la règle L.121 plus haut dans
// le fichier) : font-size 26px (était 23px), font-weight 800,
// letter-spacing -.03em (L.2168, était -.01em), color:var(--framboise)
// -- pas var(--blue)/--color-ink : le titre de section est dans la
// couleur de marque, pas la couleur de texte courant (LBP-CLIENT-16,
// 30/09/2026).
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display mb-[18px] text-[26px] font-extrabold tracking-[-0.03em] text-primary">
      {children}
    </h1>
  );
}
