// LBP-CLIENT-12 : les 6 sources officielles réelles du prototype
// (LBP_V9.9_Studio.html, var SOURCES, ligne ~12060), portées 1:1 --
// ouvrent une recherche externe sur chaque site dans un nouvel onglet,
// jamais une interrogation directe d'une API officielle (aucune n'a été
// mise à disposition -- même prudence que PISTE/Brevo/Anthropic pour les
// autres services tiers de ce projet).
export interface ExternalSource {
  name: string;
  url: (keyword: string) => string;
}

export const EXTERNAL_SOURCES: ExternalSource[] = [
  { name: "Légifrance", url: (k) => `https://www.legifrance.gouv.fr/search/all?query=${k}` },
  { name: "BOSS", url: (k) => `https://www.google.com/search?q=${k}+site:boss.gouv.fr` },
  {
    name: "Ministère du Travail",
    url: (k) => `https://www.google.com/search?q=${k}+site:travail-emploi.gouv.fr`,
  },
  { name: "URSSAF", url: (k) => `https://www.google.com/search?q=${k}+site:urssaf.fr` },
  {
    name: "Code du travail",
    url: (k) => `https://www.google.com/search?q=${k}+code+du+travail+site:legifrance.gouv.fr`,
  },
  {
    name: "Code de la sécurité sociale",
    url: (k) =>
      `https://www.google.com/search?q=${k}+code+de+la+securite+sociale+site:legifrance.gouv.fr`,
  },
];
