"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Les 10 sections du Studio (§3 du dossier). Seules celles qui ont un
// écran réel sont des liens ; les autres restent visibles (pour donner une
// vue d'ensemble du produit cible) mais grisées et non cliquables — un
// menu qui pointerait vers des pages inexistantes serait pire qu'un menu
// incomplet.
const SECTIONS: { label: string; href?: string }[] = [
  { label: "Tableau de bord" },
  { label: "Clients", href: "/clients" },
  { label: "Référentiel", href: "/referentiel" },
  { label: "Questionnaires" },
  { label: "Affectations", href: "/affectations" },
  { label: "Publications", href: "/publications" },
  { label: "Veille & mises à jour" },
  { label: "Entretiens" },
  { label: "Quiz & formations" },
  { label: "Administration" },
];

export function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-5 gap-y-1 border-t border-blue-800 px-6 py-2 text-sm">
      {SECTIONS.map((section) => {
        if (!section.href) {
          return (
            <span
              key={section.label}
              className="cursor-default text-blue-400"
              title="Pas encore construit"
            >
              {section.label}
            </span>
          );
        }
        const isActive = pathname === section.href || pathname.startsWith(`${section.href}/`);
        return (
          <Link
            key={section.label}
            href={section.href}
            className={isActive ? "font-medium text-white" : "text-blue-100 hover:text-white"}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
