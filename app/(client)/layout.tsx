import type { ReactNode } from "react";
import Link from "next/link";
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
        <Link href="/bibliotheque" className="text-sm font-semibold tracking-wide text-ink">
          LE LIVRE BLANC DE LA PAIE
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-full border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink"
          >
            Déconnexion
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
