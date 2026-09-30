import type { ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { logout } from "@/app/login/actions";

// Fondations LBP Client (ARCHITECTURE.md §4 : app/(client)/ + app/(admin)/
// dans le même projet Next.js, même base Supabase — jamais deux applis
// séparées). `.theme-client` (app/globals.css) redéfinit les variables
// sémantiques consommées par ui-kit/ avec la vraie palette sauge/encre du
// prototype LBP Client (lib/design-tokens-client.ts, port 1:1 de
// LBP_V2-20.html) — mêmes composants Button/Card/Badge que le Studio,
// jamais un deuxième ui-kit/ (STU-DESIGN-02).
//
// Chrome statique, sans vérification de session ici (même principe que
// app/(studio)/layout.tsx) : un boundary error.tsx ne peut pas rattraper
// une erreur levée par le layout de son propre segment (seulement par les
// pages en dessous) — trouvé en testant en réel un accès admin sur
// /bibliotheque, qui plantait sur une page d'erreur Next générique tant que
// requireClient() était appelé ici. Chaque page appelle requireClient()
// elle-même, comme requireAdmin() côté Studio.
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-client min-h-screen bg-page-bg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/accueil" className="text-sm font-semibold tracking-wide text-ink">
            LE LIVRE BLANC DE LA PAIE
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/accueil" className="text-sm font-medium text-muted hover:text-ink">
              Accueil
            </Link>
            <Link href="/mon-entreprise" className="text-sm font-medium text-muted hover:text-ink">
              Mon entreprise
            </Link>
            <Link href="/bibliotheque" className="text-sm font-medium text-muted hover:text-ink">
              La bibliothèque
            </Link>
            <Link href="/actu" className="text-sm font-medium text-muted hover:text-ink">
              Actu
            </Link>
            <Link href="/chiffres-paie" className="text-sm font-medium text-muted hover:text-ink">
              Chiffres Paie
            </Link>
            <Link href="/dictionnaire" className="text-sm font-medium text-muted hover:text-ink">
              Dictionnaire
            </Link>
            <Link href="/mes-quiz" className="text-sm font-medium text-muted hover:text-ink">
              Quizz
            </Link>
            <Link href="/offres" className="text-sm font-medium text-muted hover:text-ink">
              Offres
            </Link>
            <Link href="/prise-en-main" className="text-sm font-medium text-muted hover:text-ink">
              Prise en main
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="rounded-full border border-border p-2 text-muted transition-colors hover:border-ink hover:text-ink"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <Link
            href="/mon-compte"
            className="rounded-full border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink"
          >
            Mon compte
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
