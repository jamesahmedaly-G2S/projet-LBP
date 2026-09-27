import type { ReactNode } from "react";

// ui-kit : conteneur générique pour regrouper une section d'écran (carte
// blanche, bord discret, ombre légère) — répété tel quel sur tous les
// écrans Studio plutôt que de dupliquer les classes.
// `padded=false` pour un contenu qui gère lui-même son espacement (ex.
// liste à lignes divisées) — évite de dépendre de l'ordre des classes
// Tailwind pour écraser le padding par défaut, qui n'est pas fiable.
export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-studio-line bg-studio-card shadow-[0_1px_3px_rgba(20,48,79,0.05)] ${padded ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
