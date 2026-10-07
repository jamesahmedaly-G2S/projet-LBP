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
      className={`inline-flex items-center rounded-full border px-4 py-2 text-[13px] leading-[1.35] transition-colors ${
        active
          ? "border-[#efe7e1] bg-[#efe7e1] font-extrabold text-ink"
          : "border-[rgba(245,240,236,0.22)] bg-[rgba(245,240,236,0.14)] font-semibold text-white hover:border-[rgba(245,240,236,0.45)] hover:bg-[rgba(245,240,236,0.24)]"
      }`}
    >
      <Icon className="mr-1.5 h-[17px] w-[17px]" />
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
    // Une seule rangée flex-wrap (gap 7px) comme `.topnav` : les pilules
    // passent à la ligne d'elles-mêmes, la recherche (`ml-auto`) se cale à
    // droite de la dernière rangée, à hauteur de « Prise en main ».
    <nav className="hidden flex-wrap items-center gap-[7px] md:flex">
      {[...MAIN_NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map((item) => (
        <NavPill key={item.href} {...item} active={isActive(item.href)} />
      ))}
      {trailing}
    </nav>
  );
}
