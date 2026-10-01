// LBP-CLIENT-01 (finitions fidélité, 01/10/2026) : chaque page du client
// réel (prototype V9.9, règles `body:has(#v-xxx.active){background:...}`,
// feuille de style ~L2229-2268) a une photo de fond plein écran (voile
// minéral semi-transparent par-dessus, cf. PageBackdrop.tsx) -- absente de
// notre version jusqu'ici. Images sources fournies par Pauline dans
// LBP_V2/image_design/, copiées telles quelles dans public/page-bg/.
// Seul `/accueil` est renseigné pour l'instant (demande explicite) ; les 8
// autres entrées (accrochées aux mêmes assets que le prototype) viendront
// page par page plutôt que d'être devinées en bloc.
export const PAGE_BACKGROUNDS: Record<string, { src: string; veil: number }> = {
  "/accueil": { src: "/page-bg/accueil.jpg", veil: 0.6 },
};
