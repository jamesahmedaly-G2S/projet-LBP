import type { ReactNode } from "react";
import Link from "next/link";
import { StudioNav } from "./_components/StudioNav";
import { LinkButton } from "@/ui-kit/LinkButton";
import { logout } from "@/app/login/actions";

// Chrome commun à tous les écrans Studio : en-tête + navigation. Les
// sections sans écran restent visibles mais grisées (StudioNav) plutôt que
// masquées, pour donner une vue d'ensemble du produit cible.
// `st-head-actions` du prototype (LBP_V9.9_Studio.html, L.6618-6619) : "+
// Nouveau client" (STU-CLIENT-01), "Déconnexion" et "LBP Client" -- ce
// dernier remplace l'ancien "Quitter le Studio" qui faisait les deux à la
// fois. Le prototype bascule closeStudio() sur la même page (simulation
// localStorage, cf. L.4551 "LBP CLIENT → espace de l'entreprise cliente.
// URL distincte" -- son propre commentaire d'architecture confirme que ce
// n'est pas le comportement de production à reproduire) : ici, Studio et
// Client sont deux rôles/sessions réels distincts (une session admin ne
// peut pas devenir cliente), donc "LBP Client" mène vers /clients, point
// de départ réel vers "Accéder au LBP du client" (STU-CLIENT-04) plutôt
// qu'un espace client générique qui n'existe pas côté admin.
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-studio-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-studio-navy px-6 py-3">
        <Link href="/tableau-de-bord" className="text-sm font-semibold tracking-wide text-white">
          LBP STUDIO
          <span className="ml-2 font-normal text-studio-navy-muted">Administration G2S</span>
        </Link>
        <div className="flex items-center gap-2">
          <LinkButton href="/clients/nouvelle" variant="secondary" className="bg-white">
            + Nouveau client
          </LinkButton>
          <Link
            href="/clients"
            title="Prévisualiser le LBP d'un client (Accéder au LBP du client, depuis sa fiche)"
            className="rounded-full border border-white/30 px-3 py-2 text-sm font-medium text-studio-navy-muted transition-colors hover:border-white hover:text-white"
          >
            LBP Client
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-white/30 px-3 py-2 text-sm font-medium text-studio-navy-muted transition-colors hover:border-white hover:text-white"
            >
              Déconnexion
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
