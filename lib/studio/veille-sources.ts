/**
 * Port 1:1 de `VEILLE_SOURCES` (`LBP_V6_Studio.html`) — les 7 sources
 * officielles de l'annexe 5.1 du cahier des charges, dans le même ordre.
 * Affichées comme panneau de liens (STU-VEILLE-01, écart comblé le
 * 27/09/2026) ; les URLs de scraping réelles utilisées par les connecteurs
 * (`lib/studio/monitoring-connectors/html-scraping.ts`) pointent vers des
 * sous-pages précises et restent définies séparément — ce fichier reprend
 * les URLs "vitrine" du prototype, destinées au clic humain, pas au scraping.
 */
export const VEILLE_SOURCES: { name: string; url: string }[] = [
  {
    name: "Légifrance — JORF (Ministère du travail)",
    url: "https://www.legifrance.gouv.fr/jorf/jo",
  },
  {
    name: "BOSS — Bulletin officiel de la Sécurité sociale",
    url: "https://boss.gouv.fr/portail/accueil.html",
  },
  { name: "URSSAF", url: "https://www.urssaf.fr/accueil.html" },
  { name: "Code du travail numérique", url: "https://code.travail.gouv.fr" },
  { name: "Ministère du travail", url: "https://travail-emploi.gouv.fr/" },
  { name: "CPAM — Ameli (actualités)", url: "https://www.ameli.fr/yvelines/assure/actualites" },
  { name: "BOCC — Conventions collectives", url: "https://www.legifrance.gouv.fr/liste/bocc" },
];
