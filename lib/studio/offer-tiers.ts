/**
 * Mapping d'affichage Studio pour les offres commerciales.
 *
 * `offer_tiers` (table de James) n'est jamais modifiee : ce module traduit
 * ses 4 lignes existantes (Le Socle / La Branche / Le Referentiel /
 * Le Sur-mesure, prix HT/mois) vers le vocabulaire et la tarification reels
 * du pivot Studio (LBP Essentiel / Metier / Entreprise / Signature, prix
 * annuel). Voir tickets/STU-DATA.md, STU-DATA-06.
 */

export interface StudioOfferTier {
  tierLevel: number;
  name: string;
  priceLabel: string;
  includedUsers: number;
  extraUserPrice: number | null;
  isCustomQuote: boolean;
}

const STUDIO_OFFER_TIERS: Record<number, StudioOfferTier> = {
  1: {
    tierLevel: 1,
    name: "LBP Essentiel",
    priceLabel: "199 € HT / an",
    includedUsers: 3,
    extraUserPrice: 30,
    isCustomQuote: false,
  },
  2: {
    tierLevel: 2,
    name: "LBP Métier",
    priceLabel: "349 € HT / an",
    includedUsers: 5,
    extraUserPrice: 40,
    isCustomQuote: false,
  },
  3: {
    tierLevel: 3,
    name: "LBP Entreprise",
    priceLabel: "600 € HT / an",
    includedUsers: 10,
    extraUserPrice: 50,
    isCustomQuote: false,
  },
  4: {
    tierLevel: 4,
    name: "LBP Signature",
    priceLabel: "À partir de 990 € HT / an, sur devis",
    includedUsers: 20,
    extraUserPrice: null,
    isCustomQuote: true,
  },
};

export function getStudioOfferTier(tierLevel: number): StudioOfferTier {
  const tier = STUDIO_OFFER_TIERS[tierLevel];
  if (!tier) {
    throw new Error(`Palier d'offre inconnu : ${tierLevel}`);
  }
  return tier;
}

export interface OfferTierLayers {
  rg: boolean;
  ccn: boolean;
  ent: boolean;
  proc: boolean;
}

interface OfferTierRow {
  tier_level: number;
  includes_cba: boolean;
  includes_agreements: boolean;
}

/**
 * Derive les couches Studio (rg/ccn/ent/proc) a partir des colonnes reelles
 * de `offer_tiers` (includes_cba -> ccn, includes_agreements -> ent),
 * sans creer de nouvelle colonne en base. `proc` (Sur-mesure) est reserve
 * au palier 4, sans equivalent existant a reutiliser.
 */
export function getOfferTierLayers(row: OfferTierRow): OfferTierLayers {
  return {
    rg: true,
    ccn: row.includes_cba,
    ent: row.includes_agreements,
    proc: row.tier_level === 4,
  };
}
