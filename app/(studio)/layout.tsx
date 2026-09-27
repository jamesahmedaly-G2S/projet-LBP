import type { ReactNode } from "react";
import Link from "next/link";
import { StudioNav } from "./_components/StudioNav";
import { LinkButton } from "@/ui-kit/LinkButton";
import { logout } from "@/app/login/actions";

// Chrome commun à tous les écrans Studio : en-tête + navigation. Les
// sections sans écran restent visibles mais grisées (StudioNav) plutôt que
// masquées, pour donner une vue d'ensemble du produit cible.
// `st-head-actions` du prototype (LBP_V6_Studio.html) : "+ Nouveau client"
// (STU-CLIENT-01) et "Quitter le Studio" (déconnexion réelle en attendant
// la vue "LBP Client" de STU-CLIENT-04, cf. logout()).
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-studio-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-studio-navy px-6 py-3">
        <Link href="/referentiel" className="text-sm font-semibold tracking-wide text-white">
          LBP STUDIO
          <span className="ml-2 font-normal text-studio-navy-muted">Administration G2S</span>
        </Link>
        <div className="flex items-center gap-2">
          <LinkButton href="/clients/nouvelle" variant="secondary" className="bg-white">
            + Nouveau client
          </LinkButton>
          <form action={logout}>
            <button
              type="submit"
              title="Déconnexion"
              className="rounded-full border border-white/30 px-3 py-2 text-sm font-medium text-studio-navy-muted transition-colors hover:border-white hover:text-white"
            >
              Quitter le Studio
            </button>
          </form>
        </div>
      </header>
      <div className="border-b border-studio-line bg-white">
        <StudioNav />
      </div>
      {children}
    </div>
  );
}
