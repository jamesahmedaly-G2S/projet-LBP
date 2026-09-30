import type { ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { StudioNav } from "./_components/StudioNav";
import { LinkButton } from "@/ui-kit/LinkButton";
import { logout } from "@/app/login/actions";

// Chrome commun à tous les écrans Studio : en-tête + navigation. Les
// sections sans écran restent visibles mais grisées (StudioNav) plutôt que
// masquées, pour donner une vue d'ensemble du produit cible.
// `st-head-actions` du prototype (LBP_V9.9_Studio.html, L.6618-6619) : "+
// Nouveau client" (STU-CLIENT-01), "Déconnexion" et "LBP Client" -- ce
// dernier remplace l'ancien "Quitter le Studio" qui faisait les deux à la
// fois. Le prototype bascule directement vers l'appli client complète
// (closeStudio(), "profile" = persona fixe, jamais un choix par société --
// vérifié dans le vrai code avant de construire) : "LBP Client" mène donc
// vers /lbp-client, qui redirige directement vers la prévisualisation
// complète (STU-CLIENT-04 étendu) de la société la plus récente -- pas
// une étape de sélection intermédiaire, conformément au comportement réel
// du prototype (corrigé le 30/09/2026 après retour explicite : la
// première version pointait vers /clients, jugé insuffisant).
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
            href="/notifications-g2s"
            aria-label="Notifications"
            title="Notifications (audience G2S — §1.12 du cahier)"
            className="rounded-full border border-white/30 p-2 text-studio-navy-muted transition-colors hover:border-white hover:text-white"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <Link
            href="/lbp-client"
            title="Voir le vrai LBP Client (prévisualisation complète, société la plus récente)"
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
