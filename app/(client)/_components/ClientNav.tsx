"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from "./nav-items";

// LBP Client (finitions design) : pendant de StudioNav.tsx -- même besoin
// d'un composant client pour usePathname(), le layout parent reste un
// Server Component. Pilules actif/inactif portées 1:1 (header.top .topnav
// button / .on, "COUCHE CHARTE G2S"). Masquée sous 768px (`hidden md:flex`)
// -- au-delà de 9 pilules, `flex-wrap` seul devient un empilement illisible
// sur petit écran (le vrai prototype n'a pas de solution ici, jamais testé
// sur mobile) ; MobileNav.tsx prend le relais avec un menu burger.
function NavPill({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active
          ? "border-[#efe7e1] bg-[#efe7e1] text-ink"
          : "border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20"
      }`}
    >
      <Icon className="h-[15px] w-[15px]" />
      {label}
    </Link>
  );
}

// Correctif fidélité (04/10/2026), suite au retour de l'utilisateur ("ça
// peut remonter un peu aligner avec prise en main") : la recherche vivait
// dans sa propre ligne sous ClientNav tout entier -- trop bas d'une ligne.
// `trailing` permet de la rendre sur la même ligne que la rangée
// secondaire (qui ne contient que "Prise en main"), alignée à droite via
// `justify-between`, sans dupliquer la logique de pilules.
export default function ClientNav({ trailing }: { trailing?: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="hidden flex-col gap-1.5 md:flex">
      <div className="flex flex-wrap items-center gap-1.5">
        {MAIN_NAV_ITEMS.map((item) => (
          <NavPill key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {SECONDARY_NAV_ITEMS.map((item) => (
            <NavPill key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>
        {trailing}
      </div>
    </nav>
  );
}
