import type { ReactNode } from "react";

// Port 1:1 de .section-title (LBP_V2-20.html ligne 90) : font-size 23px,
// font-weight 800, color var(--blue) (= --color-ink côté client),
// margin-bottom 18px, letter-spacing -.01em, Plus Jakarta Sans.
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display mb-[18px] text-[23px] font-extrabold tracking-[-0.01em] text-ink">
      {children}
    </h1>
  );
}
