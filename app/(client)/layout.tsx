import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Search } from "lucide-react";
import { logout } from "@/app/login/actions";
import ClientNav from "./_components/ClientNav";
import MobileNav from "./_components/MobileNav";
import AccountBadge from "./_components/AccountBadge";
import AssistanceButton from "./_components/AssistanceButton";
import PageBackdrop from "./_components/PageBackdrop";
import BackBar from "./_components/BackBar";

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
// un client n'a jamais accès au Studio -- pas de mode à basculer.
//
// Correctif fidélité (03/10/2026), suite à un retour direct de
// l'utilisateur ("le vrai titre ne dis pas ça") : un choix précédent
// gardait "LE LIVRE BLANC DE LA PAIE"/"PAR G2S" plutôt que le vrai texte
// du prototype, en le justifiant comme "déjà établi dans tout ce
// projet" -- mauvaise priorité, jamais revérifié depuis. Le vrai
// marquage (`.brand`, `LBP_V9.9_Studio.html` ~L2515-2517) est
// `<strong>LBP</strong><small>Référentiel Paie · by G2S</small>`, porté
// ici tel quel. `.brand-text{border-left:3px solid var(--coral)}`
// (liseré framboise) également ajouté, jamais remarqué avant ce
// correctif.
//
// Responsive (finitions, 30/09/2026) : le vrai prototype n'a pas de menu
// mobile fonctionnel pour ces 9 onglets (pas de media query ni de JS
// burger sur <nav class="top-tools topnav">) -- l'app doit pourtant
// fonctionner sur téléphone (objectif exprimé : mobilisable/installable).
// Sous 768px : ClientNav (pilules) et le bloc compte/déconnexion se
// masquent, MobileNav (menu burger plein écran) prend le relais avec les
// mêmes liens + les actions qu'il masque de la ligne principale.
// Construit indépendamment du prototype sur ce point précis.
//
// Correctif fidélité (03/10/2026), en deux temps, suite aux retours
// directs de l'utilisateur relayant Pauline :
// 1) "la barre de recherche n'est pas à sa place... en bas en dessous de
//    déconnexion et des autres onglets... ne doit pas prendre toute
//    cette longueur" -- sortie de la ligne du haut (pleine largeur,
//    flex-1), d'abord replacée à droite de la ligne des onglets (position
//    du second élément de recherche du vrai marquage, purement visuel,
//    `.globalsearch.nav-search`, `margin-left:auto`, `LBP_V9.9_Studio.html`
//    ~L2548-2551/482).
// 2) Correction : "la recherche ne doit pas être vers la ligne des
//    onglets mais en dessous... c'est très bien de ce côté gauche de
//    l'écran" -- Pauline veut une ligne à part, sous les onglets, alignée
//    à gauche (pas poussée à droite avec eux). `ClientNav` et la
//    recherche redeviennent donc deux lignes empilées, chacune sur toute
//    la largeur, plutôt qu'une seule ligne flex partagée -- la largeur
//    plafonnée (240px) et un seul vrai champ fonctionnel restent comme au
//    point 1.
// 3) Correction (04/10/2026) : "la recherche n'est pas encore à la bonne
//    place, elle doit être décalée de l'autre côté" -- toujours sur sa
//    propre ligne sous les onglets, mais alignée à droite plutôt qu'à
//    gauche (`md:justify-end` sur le conteneur de la ligne).
// 4) Correction (04/10/2026) : "ça peut remonter un peu aligner avec
//    prise en main" -- la recherche vivait sur une ligne à part sous
//    ClientNav tout entier (donc sous "Prise en main" aussi), un cran
//    trop bas. Remontée d'une ligne : `ClientNav` accepte désormais un
//    slot `trailing`, rendu sur la même ligne que "Prise en main"
//    (rangée secondaire), poussé à droite via `justify-between` -- plus
//    de ligne dédiée à la recherche.
// Correctif fidélité (06/10/2026, mesures getComputedStyle de `header.top`
// sur la V9.9) : bandeau ramené aux vraies dimensions -- padding 18px 30px,
// badge logo 52px (radius 14, padding 6, filet --ligne), ligne du haut gap
// 22px, cloche nue 19px, pilules de nav 13px/600 (800 active), padding
// 8px 16px, gap 7px, pictogrammes 17px, marge haute 14px. Revient sur le
// resserrage du 1f57401 ("bandeau plus compact") au profit de la maquette.
// La recherche reste sur la rangée de « Prise en main », poussée à droite
// (choix de Pauline, voir plus haut) -- c'est d'ailleurs la position du
// second champ `.nav-search` de la maquette (`margin-left:auto`).
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-client min-h-screen">
      <PageBackdrop />
      <header className="sticky top-0 z-50 bg-primary px-[30px] py-[18px] text-white">
        <div className="flex flex-wrap items-center gap-[22px]">
          <Link href="/accueil" className="flex shrink-0 items-center gap-[13px]">
            <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[14px] border border-border bg-white p-1.5">
              <Image
                src="/g2s-logo.png"
                alt="G2S"
                width={38}
                height={38}
                priority
                className="h-full w-full object-contain"
              />
            </span>
            <span className="hidden border-l-[3px] border-white/55 pl-[13px] leading-[1.1] sm:block">
              <span className="block text-[20px] leading-[1.1] font-extrabold tracking-[0.14em] text-white">
                LBP
              </span>
              <span className="mt-1 block text-[9.5px] leading-[1.1] font-medium tracking-[0.14em] text-white/85 uppercase">
                Référentiel Paie · by G2S
              </span>
            </span>
          </Link>

          <div className="flex-1" />

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="rounded-md px-1.5 py-1 text-white transition-colors hover:bg-white/10"
          >
            <Bell className="h-[19px] w-[19px]" />
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <AccountBadge />

            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                Déconnexion
              </button>
            </form>
          </div>

          <MobileNav />
        </div>

        <div className="hidden md:mt-[14px] md:block">
          <ClientNav
            trailing={
              <form
                action="/recherche"
                className="ml-auto flex w-full max-w-[240px] shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3.5 py-[7px]"
              >
                <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <label className="sr-only" htmlFor="gq">
                  Recherche globale dans le LBP
                </label>
                <input
                  type="search"
                  id="gq"
                  name="q"
                  placeholder="Rechercher…"
                  className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
                />
              </form>
            }
          />
        </div>
      </header>

      <BackBar />
      {children}

      <AssistanceButton />
    </div>
  );
}
