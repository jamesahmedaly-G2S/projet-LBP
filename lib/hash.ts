// Hash déterministe texte -> index, extrait de ArticleCover.tsx
// (LBP-CLIENT-04) pour être réutilisé ailleurs (TeamSection.tsx,
// LBP-CLIENT-02) sans dupliquer la leçon qui va avec : FNV-1a plutôt
// qu'un hash "h*31+c" classique -- avec un petit modulo (ex. 3), 31 ≡ 1
// (mod 3) fait dégénérer ce dernier en une simple somme de codes de
// caractères (vérifié en testant avec les vraies catégories du
// prototype, qui retombaient toutes sur la même variante). FNV-1a
// distribue correctement même sur un petit modulo.
export function fnv1aIndex(s: string, modulo: number): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}
