import type { ReactNode } from "react";

// Port 1:1 de .section-title -- correctif fidélité (03/10/2026), suite à
// un retour de l'utilisateur ("compare bien mot pour mot et taille pour
// taille") : un bloc PLUS TARDIF que la "COUCHE CHARTE G2S" (L.2169)
// existe dans la feuille de style, "TITRES — renforcement demandé"
// (L.2461-2471), en `!important` sur font-size/font-weight/color -- il
// l'emporte sans ambiguïté sur la cascade, jamais vérifié jusqu'ici.
// Vraies valeurs : font-size 29px (24px à ≤760px, @media avec le même
// !important), color:var(--titre)=#33405A (PAS --framboise : un
// bleu-gris plus sombre que --carbone, introduit spécifiquement pour les
// titres, "sans changer la palette du produit" dit le commentaire du
// prototype), letter-spacing -.018em, line-height 1.2, margin-bottom 20px.
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display mb-5 text-[29px] leading-[1.2] font-extrabold tracking-[-0.018em] text-[#33405A] max-[760px]:text-2xl">
      {children}
    </h1>
  );
}
