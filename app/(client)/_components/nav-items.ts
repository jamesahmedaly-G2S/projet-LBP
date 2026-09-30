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
  type LucideIcon,
} from "lucide-react";

// LBP Client : liste unique des onglets de nav, réutilisée par ClientNav.tsx
// (pilules desktop) ET MobileNav.tsx (menu burger, <768px) -- jamais deux
// listes à maintenir en parallèle. Ordre et icônes vérifiés contre le vrai
// header du prototype (LBP_V9.9_Studio.html, <nav class="top-tools topnav">).
export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
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

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/prise-en-main", label: "Prise en main", Icon: HelpCircle },
];
