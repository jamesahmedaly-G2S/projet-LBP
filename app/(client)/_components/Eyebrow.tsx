import type { ReactNode } from "react";

// Port 1:1 de .eyebrow (LBP_V2-20.html ligne 89) : font-size 11px,
// letter-spacing .16em, uppercase, color var(--sage-darker), weight 700,
// Plus Jakarta Sans (.disp,.eyebrow{font-family:'Plus Jakarta Sans'}).
// --sage-darker (#4F6139) = --color-primary-hover côté .theme-client,
// jamais un nouveau jeton de couleur pour ça.
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-display mb-1 text-[11px] font-bold tracking-[0.16em] text-primary-hover uppercase">
      {children}
    </p>
  );
}
