import type { ReactNode } from "react";
import Link from "next/link";
import { StudioNav } from "./_components/StudioNav";

// Chrome commun à tous les écrans Studio : en-tête + navigation. Les
// sections sans écran restent visibles mais grisées (StudioNav) plutôt que
// masquées, pour donner une vue d'ensemble du produit cible — le menu
// complet et cliquable partout attend STU-DESIGN-01.
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-blue-900 px-6 py-3">
        <Link href="/referentiel" className="text-sm font-semibold tracking-wide text-white">
          LBP STUDIO
          <span className="ml-2 font-normal text-blue-200">Administration G2S</span>
        </Link>
      </header>
      <div className="bg-blue-900">
        <StudioNav />
      </div>
      {children}
    </div>
  );
}
