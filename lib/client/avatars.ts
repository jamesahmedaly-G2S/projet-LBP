// LBP-CLIENT-02 : les 124 avatars de l'organigramme (`var AVATARS`,
// `LBP_V9.9_Studio.html` ~L10175) extraits en fichiers statiques
// (`public/avatars/0.jpg`..`123.jpg`, script ponctuel, jamais régénéré
// automatiquement) -- une décision précédente ("aucune source réelle de
// 124 images") était fausse, les images sont bien réelles, juste
// encodées en base64 inline dans le même fichier que le reste du
// prototype.
export const AVATAR_COUNT = 124;

export function avatarSrc(index: number): string {
  const safe = Number.isInteger(index) && index >= 0 && index < AVATAR_COUNT ? index : 0;
  return `/avatars/${safe}.jpg`;
}
