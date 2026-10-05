// LBP-CLIENT-01 (finitions fidélité, 01/10/2026) : chaque page du client
// réel (prototype V9.9, règles `body:has(#v-xxx.active){background:...}`,
// feuille de style ~L2229-2268) a une photo de fond plein écran (voile
// minéral semi-transparent par-dessus, cf. PageBackdrop.tsx) -- absente de
// notre version jusqu'ici.
//
// Image et voile portés 1:1 pour chaque page : PAS les photos Pexels
// brutes de `LBP_V2/image_design/` (portrait, recadrage `cover/center`
// imprévisible sur un viewport large -- piège déjà rencontré sur
// `/accueil`, cf. correctif du 01/10/2026 dans tickets/LBP-CLIENT.md), mais
// les JPEG réellement intégrés dans `LBP_V9.9_Studio.html` (base64 décodé
// ligne par ligne, déjà recadrés en paysage par Pauline). Opacités de voile
// copiées telles quelles depuis chaque règle CSS.
export const PAGE_BACKGROUNDS: Record<string, { src: string; veil: number }> = {
  "/accueil": { src: "/page-bg/accueil.jpg", veil: 0.6 },
  "/actu": { src: "/page-bg/actu.jpg", veil: 0.82 },
  "/mon-entreprise": { src: "/page-bg/mon-entreprise.jpg", veil: 0.82 },
  "/calendrier-rh": { src: "/page-bg/calendrier-rh.jpg", veil: 0.8 },
  "/bibliotheque": { src: "/page-bg/bibliotheque.jpg", veil: 0.8 },
  "/chiffres-paie": { src: "/page-bg/chiffres-paie.jpg", veil: 0.72 },
  "/dictionnaire": { src: "/page-bg/dictionnaire.jpg", veil: 0.8 },
  "/mes-quiz": { src: "/page-bg/mes-quiz.jpg", veil: 0.8 },
  "/offres": { src: "/page-bg/offres.jpg", veil: 0.7 },
};
