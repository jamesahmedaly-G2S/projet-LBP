import type { ReactNode } from "react";
import Link from "next/link";

// Chrome minimal commun à tous les écrans Studio (en-tête identifiant
// l'espace). La navigation complète à 10 onglets (§3 du dossier) attend
// STU-DESIGN-01 — la plupart des onglets n'ont pas encore d'écran, un menu
// complet serait trompeur pour l'instant.
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-blue-900 px-6 py-3">
        <Link href="/referentiel" className="text-sm font-semibold tracking-wide text-white">
          LBP STUDIO
          <span className="ml-2 font-normal text-blue-200">Administration G2S</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
