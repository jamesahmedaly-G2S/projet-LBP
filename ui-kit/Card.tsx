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
      className={`rounded-lg border border-zinc-200 bg-white shadow-sm ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
