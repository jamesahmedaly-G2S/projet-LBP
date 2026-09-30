"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Calendar,
  BookOpen,
  Newspaper,
  LineChart,
  BookMarked,
  Trophy,
  Tag,
  HelpCircle,
} from "lucide-react";

// LBP Client (finitions design, 30/09/2026) : pendant de StudioNav.tsx
// (app/(studio)/_components/StudioNav.tsx) -- même besoin d'un composant
// client pour usePathname(), le layout parent reste un Server Component.
// Ordre et icônes vérifiés contre le vrai header du prototype
// (LBP_V9.9_Studio.html, <nav class="top-tools topnav">, lignes ~2526-2539) :
// 9 onglets sur une ligne, "Prise en main" isolé sur sa propre ligne en
// dessous (même disposition ici). Pilules actif/inactif portées 1:1
// (header.top .topnav button / .on, "COUCHE CHARTE G2S" en fin de feuille).
const MAIN_ITEMS = [
  { href: "/accueil", label: "Accueil", Icon: Home },
  { href: "/mon-entreprise", label: "Mon entreprise", Icon: Building2 },
  { href: "/calendrier-rh", label: "Calendrier RH", Icon: Calendar },
  { href: "/bibliotheque", label: "La bibliothèque", Icon: BookOpen },
  { href: "/actu", label: "Actu", Icon: Newspaper },
  { href: "/chiffres-paie", label: "Chiffres Paie", Icon: LineChart },
  { href: "/dictionnaire", label: "Dictionnaire", Icon: BookMarked },
  { href: "/mes-quiz", label: "Quizz", Icon: Trophy },
  { href: "/offres", label: "Offres", Icon: Tag },
];

const SECONDARY_ITEMS = [{ href: "/prise-en-main", label: "Prise en main", Icon: HelpCircle }];

function NavPill({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
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

export default function ClientNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {MAIN_ITEMS.map((item) => (
          <NavPill key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {SECONDARY_ITEMS.map((item) => (
          <NavPill key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}
