import {
  Home,
  Users,
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
//
// Correctif (04/10/2026), suite au retour de l'utilisateur ("si on revient
// sur l'onglet aussi l'emodjie ne correspond pas") : l'icône de "Mon
// entreprise" était `Building2` -- le vrai bouton (~L2539) porte
// `data-ico="users"`, pas une icône de bâtiment. Changé en `Users`, même
// icône que la section "Organisation" de la page elle-même.
export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/accueil", label: "Accueil", Icon: Home },
  { href: "/mon-entreprise", label: "Mon entreprise", Icon: Users },
  { href: "/calendrier-rh", label: "Calendrier RH", Icon: Calendar },
  { href: "/bibliotheque", label: "La bibliothèque", Icon: BookOpen },
  { href: "/actu", label: "Actu-Veille · Décrypt RH&Paie", Icon: Newspaper },
  { href: "/chiffres-paie", label: "Chiffres Paie", Icon: LineChart },
  { href: "/dictionnaire", label: "Dictionnaire", Icon: BookMarked },
  { href: "/mes-quiz", label: "Quizz", Icon: Trophy },
  { href: "/offres", label: "Offres", Icon: Tag },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/prise-en-main", label: "Prise en main", Icon: HelpCircle },
];
