/**
 * Catalogue d'affichage des 4 offres commerciales — contenu marketing
 * porté à l'origine 1:1 depuis `LBP_V6_Studio.html` (`var OFFERS=[...]`
 * lignes 4942-4986, `LVLABEL`/`offPrice()` lignes 4991-5148), maintenant
 * lu depuis `studio_offer_content` (migration `20260930090000`, STU-OFFER-03)
 * plutôt qu'en dur dans ce fichier — G2S peut désormais l'éditer depuis
 * `/administration/offres`. `offer_tiers` (table réelle de James, jamais
 * modifiée) reste la seule source pour tier_level/includes_cba/
 * includes_agreements/unlocks_detail/max_messages_per_month, utilisés par
 * `getOfferTierLayers()` plus bas, indépendant de ce contenu marketing.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface StudioOfferTier {
  tierLevel: number;
  name: string;
  sub: string;
  price: number;
  users: number;
  extraUserPrice: number | null;
  isCustomQuote: boolean;
  badge: string;
  reco: boolean;
  promesse: string;
  sousPromesse?: string;
  desc: string;
  pourqui: string;
  inc: string[];
  why: string[];
  foot: string;
  cta: string;
  cta2: string;
  highlight?: string;
  formula?: string[];
  blocs?: [string, string][];
  note?: string;
}

export const LVLABEL = [
  "Réglementation",
  "Convention collective",
  "Accords & usages",
  "Process internes",
];

/** Niveau de personnalisation cumulatif par palier — tierLevel > index (identique à `lv` dans OFFERS). */
export function tierLevels(tierLevel: number): boolean[] {
  return [0, 1, 2, 3].map((i) => tierLevel > i);
}

interface StudioOfferContentRow {
  tier_level: number;
  name: string;
  sub: string;
  price: number;
  users: number;
  extra_user_price: number | null;
  badge: string;
  reco: boolean;
  promesse: string;
  sous_promesse: string | null;
  description: string;
  pourqui: string;
  inc: string[];
  why: string[];
  foot: string;
  cta: string;
  cta2: string;
  highlight: string | null;
  formula: string[] | null;
  blocs: [string, string][] | null;
  note: string | null;
}

function toStudioOfferTier(row: StudioOfferContentRow): StudioOfferTier {
  return {
    tierLevel: row.tier_level,
    name: row.name,
    sub: row.sub,
    price: row.price,
    users: row.users,
    extraUserPrice: row.extra_user_price,
    isCustomQuote: row.extra_user_price === null,
    badge: row.badge,
    reco: row.reco,
    promesse: row.promesse,
    sousPromesse: row.sous_promesse ?? undefined,
    desc: row.description,
    pourqui: row.pourqui,
    inc: row.inc,
    why: row.why,
    foot: row.foot,
    cta: row.cta,
    cta2: row.cta2,
    highlight: row.highlight ?? undefined,
    formula: row.formula ?? undefined,
    blocs: row.blocs ?? undefined,
    note: row.note ?? undefined,
  };
}

export async function getStudioOfferTier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  tierLevel: number,
): Promise<StudioOfferTier> {
  const { data, error } = await supabase
    .from("studio_offer_content")
    .select("*")
    .eq("tier_level", tierLevel)
    .single();
  if (error || !data) {
    throw new Error(`Palier d'offre inconnu : ${tierLevel}`);
  }
  return toStudioOfferTier(data as StudioOfferContentRow);
}

export async function getAllStudioOfferTiers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<StudioOfferTier[]> {
  const { data, error } = await supabase
    .from("studio_offer_content")
    .select("*")
    .order("tier_level");
  if (error || !data) {
    throw new Error("Impossible de charger les offres.");
  }
  return (data as StudioOfferContentRow[]).map(toStudioOfferTier);
}

/** Port 1:1 de offPrice() (LBP_V6_Studio.html lignes 5132-5149). */
const MONTHLY_MARKUP = 0.2;

export interface OfferPrice {
  main: string;
  unit: string;
  sub: string;
  extraText: string;
  extraUsers: number;
  extraCost: number;
  totalText: string;
}

function fmtEur(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function computeOfferPrice(
  tier: StudioOfferTier,
  billing: "annual" | "monthly",
  userCount: number,
): OfferPrice {
  const extraUsers = Math.max(0, userCount - tier.users);

  if (billing === "annual") {
    const extraCost = tier.extraUserPrice !== null ? extraUsers * tier.extraUserPrice : 0;
    return {
      main: fmtEur(tier.price),
      unit: "€ HT / an",
      sub: "Facturé en une fois",
      extraText:
        tier.extraUserPrice !== null
          ? `+ ${fmtEur(tier.extraUserPrice)} € HT/an par utilisateur supplémentaire`
          : "Tarification personnalisée",
      extraUsers,
      extraCost,
      totalText: `${fmtEur(tier.price + extraCost)} € HT / an`,
    };
  }

  const monthlyAnnual = Math.round(tier.price * (1 + MONTHLY_MARKUP));
  const monthly = Math.round(monthlyAnnual / 12);
  const extraAnnual =
    tier.extraUserPrice !== null ? Math.round(tier.extraUserPrice * (1 + MONTHLY_MARKUP)) : null;
  const extraMonthly = extraAnnual !== null ? Math.round(extraAnnual / 12) : null;
  const totalAnnual = monthlyAnnual + (extraAnnual !== null ? extraUsers * extraAnnual : 0);

  return {
    main: fmtEur(monthly),
    unit: "€ HT / mois",
    sub: `Soit ${fmtEur(monthlyAnnual)} € HT/an`,
    extraText:
      extraMonthly !== null
        ? `+ ${fmtEur(extraMonthly)} € HT/mois par utilisateur supplémentaire`
        : "Tarification personnalisée",
    extraUsers,
    extraCost: extraAnnual !== null ? extraUsers * extraAnnual : 0,
    totalText: `${fmtEur(totalAnnual / 12)} € HT / mois · soit ${fmtEur(totalAnnual)} € HT/an`,
  };
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
