/**
 * Libellés d'affichage des 4 couches de contenu versionnées indépendamment
 * (`layer_kind`, STU-DATA-02). Source unique réutilisée par tous les
 * écrans qui listent des `sheet_versions` (contrôle, historique,
 * publications...). Correspondance avec les paliers d'offre :
 * `lib/studio/offer-tiers.ts` (`getOfferTierLayers`).
 */
export type LayerKind = "rg" | "ccn" | "ent" | "proc";

export const LAYER_KIND_LABELS: Record<LayerKind, string> = {
  rg: "Régime général",
  ccn: "Convention collective",
  ent: "Accords d'entreprise",
  proc: "Sur-mesure",
};

export function getLayerKindLabel(layerKind: string): string {
  return LAYER_KIND_LABELS[layerKind as LayerKind] ?? layerKind;
}
