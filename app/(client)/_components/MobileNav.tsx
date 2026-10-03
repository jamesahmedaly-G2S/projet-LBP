"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { logout } from "@/app/login/actions";
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "./nav-items";

// LBP Client (finitions design) : le vrai prototype n'a pas de menu mobile
// fonctionnel à cet endroit (pas de media query ni de JS burger pour
// <nav class="top-tools topnav"> dans LBP_V9.9_Studio.html) -- 9 pilules
// en flex-wrap deviendraient un empilement illisible sur un écran de
// téléphone. Construit indépendamment du prototype : nécessité réelle
// pour une appli pensée mobile dès maintenant, pas une fidélité à porter.
// Visible seulement sous 768px (`md:hidden`), regroupe aussi Mon compte/
// Déconnexion (masqués de la ligne principale sur mobile pour lui laisser
// de la place) -- la cloche reste sur la ligne principale, assez petite
// pour y rester.
//
// Le panneau est monté via createPortal(..., document.body) plutôt que
// rendu en place : ce composant est un enfant du <header> (sticky, son
// propre contexte d'empilement) -- trouvé en testant réellement le clic
// sur un lien du menu ouvert (Playwright cliquait "normalement" sans
// erreur mais sans naviguer, uniquement avec { force: true } que ça
// marchait), signe qu'un élément du header en dessous interceptait le
// clic malgré un z-index supérieur en apparence. Un portail sort le
// panneau de toute hiérarchie de contexte d'empilement ambiguë.
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le menu au changement de route -- state dérivé pendant le rendu
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // plutôt qu'un useEffect(…, [pathname]), qui déclencherait un rendu en
  // cascade évitable.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const panel = open && (
    <div className="theme-client fixed inset-0 z-[100] bg-primary text-white md:hidden">
      <div className="flex items-center justify-between px-6 py-2.5">
        <span className="text-[20px] font-extrabold tracking-[0.14em]">LBP</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
          className="rounded-full border border-white/25 bg-white/10 p-2 text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto px-4 py-3">
        {[...MAIN_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-semibold ${
                active ? "bg-[#efe7e1] text-ink" : "text-white hover:bg-white/10"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}

        <div className="mt-3 flex flex-col gap-1 border-t border-white/20 pt-3">
          <Link
            href="/mon-compte"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-semibold text-white hover:bg-white/10"
          >
            Mon compte
          </Link>
          <Link
            href="/notifications"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-semibold text-white hover:bg-white/10"
          >
            Notifications
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-[15px] font-semibold text-white hover:bg-white/10"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </nav>
    </div>
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="rounded-full border border-white/25 bg-white/10 p-2 text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* `open` ne peut jamais être vrai lors du rendu serveur/hydratation
          initiale (useState(false), pas de changement possible avant une
          interaction) -- pas de risque de mismatch d'hydratation, donc pas
          besoin d'un état "mounted" supplémentaire avant d'accéder à
          `document`. */}
      {panel && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </div>
  );
}
