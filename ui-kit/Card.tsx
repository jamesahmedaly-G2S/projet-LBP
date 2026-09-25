import type { ReactNode } from "react";

// ui-kit : conteneur générique pour regrouper une section d'écran (carte
// blanche, bord discret, ombre légère) — répété tel quel sur tous les
// écrans Studio plutôt que de dupliquer les classes.
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
