/**
 * Port 1:1 de `ST_CFG` (`LBP_V6_Studio.html`) — seuils centralisés du
 * "Suivi annuel" (STU-CLIENT-02, §5.2). Source unique : jamais recopiés en
 * dur ailleurs (fiche client, liste clients, vue globale entretiens) —
 * modifier une valeur ici change le comportement partout.
 */
export const STUDIO_SETTINGS = {
  entretienSeuilRouge: 15,
  entretienSeuilJaune: 60,
  entretienPeriodeMois: 12,
  publicationDelaiJours: 0,
} as const;
