import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { logout } from "@/app/login/actions";
import ClientNav from "./_components/ClientNav";
import AccountBadge from "./_components/AccountBadge";
import AssistanceButton from "./_components/AssistanceButton";

// Fondations LBP Client (ARCHITECTURE.md §4 : app/(client)/ + app/(admin)/
// dans le même projet Next.js, même base Supabase — jamais deux applis
// séparées). `.theme-client` (app/globals.css) redéfinit les variables
// sémantiques consommées par ui-kit/ avec la vraie palette framboise/
// carbone/minéral V37 (LBP-CLIENT-16) — mêmes composants Button/Card/Badge
// que le Studio, jamais un deuxième ui-kit/ (STU-DESIGN-02).
//
// Chrome statique, sans vérification de session ici (même principe que
// app/(studio)/layout.tsx) : un boundary error.tsx ne peut pas rattraper
// une erreur levée par le layout de son propre segment (seulement par les
// pages en dessous) — trouvé en testant en réel un accès admin sur
// /bibliotheque, qui plantait sur une page d'erreur Next générique tant que
// requireClient() était appelé ici. Chaque page appelle requireClient()
// elle-même, comme requireAdmin() côté Studio. L'avatar/nom (AccountBadge)
// va chercher la session côté client (/api/profiles/me) pour cette même
// raison — jamais un appel serveur direct ici.
//
// Bandeau framboise plein-largeur, nav en pilules, avatar+initiales,
// bouton Assistance flottant : vérifiés contre le vrai rendu du prototype
// (LBP_V9.9_Studio.html, mode client, "COUCHE CHARTE G2S" en fin de
// feuille) avant de construire, plutôt que devinés depuis le code source
// seul. "Mode client / LBP Studio" (toggle du prototype) délibérément
// omis : notre appli a un vrai système de rôles (admin/client, ADR-0004),
// un client n'a jamais accès au Studio -- pas de mode à basculer. Nom de
// marque gardé tel quel ("LE LIVRE BLANC DE LA PAIE", déjà établi dans
// tout ce projet) plutôt que "LBP — Référentiel Paie" vu dans cette
// version précise du prototype -- seul le style du bandeau est porté ici,
// pas un renommage produit non demandé.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-client min-h-screen bg-page-bg">
      <header className="sticky top-0 z-50 bg-primary px-6 py-4 text-white">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/accueil" className="flex shrink-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-base font-extrabold">
              G
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-wide">
                LE LIVRE BLANC DE LA PAIE
              </span>
              <span className="block text-[10px] tracking-wide text-white/75">PAR G2S</span>
            </span>
          </Link>

          <form
            action="/recherche"
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-3.5 py-2"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
            <label className="sr-only" htmlFor="gq">
              Recherche globale dans le LBP
            </label>
            <input
              type="search"
              id="gq"
              name="q"
              placeholder="Rechercher dans tout le LBP…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </form>

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="rounded-full border border-white/25 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
          >
            <Bell className="h-4 w-4" />
          </Link>

          <AccountBadge />

          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Déconnexion
            </button>
          </form>
        </div>

        <div className="mt-3">
          <ClientNav />
        </div>
      </header>

      {children}

      <AssistanceButton />
    </div>
  );
}
