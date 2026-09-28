/**
 * Catalogue d'affichage des 4 offres commerciales — port 1:1 du vrai
 * contenu client (`LBP_V6_Studio.html`, `var OFFERS=[...]` lignes
 * 4942-4986, et `LVLABEL`/`offPrice()` lignes 4991-5148 — le fichier
 * contient, sous le mode Studio, la vraie appli client complète, pas
 * seulement l'admin ; jamais consulté avant que l'utilisateur ne le
 * signale). `offer_tiers` (table de James) n'est jamais modifiée : les
 * nombres (price/users/extra) correspondent déjà exactement à ses 4
 * lignes (Le Socle/La Branche/Le Référentiel/Le Sur-mesure), seul le
 * vocabulaire et le contenu marketing sont ceux du pivot Studio.
 */

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

const STUDIO_OFFER_TIERS: Record<number, StudioOfferTier> = {
  1: {
    tierLevel: 1,
    name: "LBP Essentiel",
    sub: "L'essentiel de la paie, fiable, pratique et toujours accessible.",
    price: 199,
    users: 3,
    extraUserPrice: 30,
    isCustomQuote: false,
    badge: "",
    reco: false,
    promesse: "Toutes les règles essentielles pour sécuriser vos pratiques Paie au quotidien.",
    desc: "Accédez à une base claire, structurée et actualisée pour comprendre les règles de paie, les appliquer et retrouver rapidement les sources officielles.",
    pourqui:
      "Les entreprises qui veulent une documentation Paie fiable, sans multiplier les recherches.",
    inc: [
      "Réglementation Paie & droit social",
      "Fiches pratiques structurées par thème",
      "Règles de calcul",
      "Régimes social et fiscal",
      "Application concrète en paie",
      "Exemples et points de vigilance",
      "Sources officielles et documents opposables",
      "Quiz pour tester ses connaissances",
      "Actualités et calendrier RH",
    ],
    why: [
      "Une base juridique fiable et actualisée",
      "Un gain de temps immédiat pour l'équipe Paie",
      "Des sources officielles centralisées",
    ],
    foot: "Idéal pour disposer d'un socle Paie fiable et opérationnel, sans multiplier les recherches.",
    cta: "Choisir LBP Essentiel",
    cta2: "Découvrir l'offre",
  },
  2: {
    tierLevel: 2,
    name: "LBP Métier",
    sub: "La réglementation enrichie des règles de votre convention collective.",
    price: 349,
    users: 5,
    extraUserPrice: 40,
    isCustomQuote: false,
    badge: "",
    reco: false,
    promesse:
      "Ne vous contentez plus de la règle générale : appliquez celle de votre convention collective.",
    desc: "LBP Métier combine la réglementation nationale avec les dispositions de votre convention collective afin de vous montrer immédiatement la règle réellement applicable.",
    pourqui:
      "Les entreprises qui veulent fiabiliser leurs pratiques sans comparer manuellement le Code du travail et leur convention collective.",
    inc: [
      "Tout LBP Essentiel",
      "Votre convention collective intégrée",
      "Comparaison Loi / Convention collective",
      "Dispositions conventionnelles par thème",
      "Spécificités propres à votre secteur",
      "Sources conventionnelles",
      "Accès centralisé depuis les fiches LBP",
    ],
    why: [
      "La règle conventionnelle réellement applicable",
      "Moins d'erreurs sur les minima et les majorations",
      "Un référentiel partagé avec l'équipe",
    ],
    foot: "Idéal pour les entreprises qui veulent fiabiliser leurs pratiques sans devoir comparer manuellement le Code du travail et leur convention collective.",
    cta: "Choisir LBP Métier",
    cta2: "Découvrir l'offre",
    highlight: "LOI + VOTRE CONVENTION COLLECTIVE",
  },
  3: {
    tierLevel: 3,
    name: "LBP Entreprise",
    sub: "Le référentiel qui applique la réglementation à la réalité de votre entreprise.",
    price: 600,
    users: 10,
    extraUserPrice: 50,
    isCustomQuote: false,
    badge: "RECOMMANDÉ",
    reco: true,
    promesse: "Une seule réponse : la règle réellement applicable dans votre entreprise.",
    desc: "LBP Entreprise croise la réglementation, votre convention collective et vos propres accords et usages pour transformer le LBP en véritable référentiel Paie interne.",
    pourqui:
      "Les entreprises disposant d'accords, d'usages ou d'engagements unilatéraux à documenter et à sécuriser.",
    inc: [
      "Tout LBP Métier",
      "Vos accords collectifs d'entreprise",
      "Vos usages et engagements unilatéraux",
      "Comparaison Loi / CCN / Entreprise",
      "Règles réellement applicables dans votre organisation",
      "Référentiel partagé avec l'équipe",
      "Centralisation des sources et justificatifs",
      "Sécurisation et harmonisation des pratiques Paie",
    ],
    why: [
      "Une seule source de vérité pour toute l'équipe",
      "La fin des divergences de pratiques entre gestionnaires",
      "Des justificatifs centralisés en cas de contrôle",
    ],
    foot: "Votre équipe ne cherche plus la règle dans plusieurs sources : le LBP centralise l'environnement juridique applicable à votre entreprise.",
    cta: "Choisir LBP Entreprise",
    cta2: "Demander une démonstration",
    formula: ["LOI", "CONVENTION COLLECTIVE", "ACCORDS & USAGES"],
  },
  4: {
    tierLevel: 4,
    name: "LBP Signature",
    sub: "Votre environnement Paie & RH construit sur mesure avec G2S.",
    price: 990,
    users: 20,
    extraUserPrice: null,
    isCustomQuote: true,
    badge: "100 % PERSONNALISÉ",
    reco: false,
    promesse: "Votre expertise Paie. Vos règles. Vos procédures. Un seul environnement.",
    sousPromesse:
      "G2S transforme le LBP en référentiel opérationnel entièrement adapté à votre organisation.",
    desc: "Nous partons de votre environnement réel pour construire avec vous un LBP qui ne se contente plus d'expliquer la règle : il documente la manière dont votre entreprise doit concrètement la traiter.",
    pourqui:
      "Les organisations qui veulent capitaliser le savoir-faire de leur équipe Paie et le transmettre durablement.",
    inc: [
      "Tout LBP Entreprise",
      "Intégration de vos procédures internes",
      "Paramétrages et règles de gestion propres à l'entreprise",
      "Consignes et modes opératoires Paie",
      "Spécificités DSN",
      "Justificatifs à conserver",
      "Documents et modèles internes",
      "Cas pratiques propres à l'entreprise",
      "Contrôles et points de vigilance personnalisés",
      "Organisation de vos contenus Paie/RH",
      "Accompagnement G2S pour construire et structurer le référentiel",
    ],
    why: [
      "La capitalisation du savoir-faire de votre équipe",
      "L'harmonisation durable des méthodes",
      "Un accompagnement G2S de bout en bout",
    ],
    foot: "L'objectif : transformer les connaissances et pratiques de votre équipe en un référentiel structuré, partagé et durable.",
    cta: "Construire mon LBP",
    cta2: "Parler de mon projet avec G2S",
    blocs: [
      ["VOS RÈGLES", "Accords, usages, décisions et spécificités internes."],
      ["VOS PROCESS", "Procédures, contrôles, circuits et modes opératoires."],
      ["VOTRE PAIE", "Paramétrage, calcul, DSN, justificatifs et cas particuliers."],
      ["VOTRE ORGANISATION", "Documents, outils, pratiques et environnement interne."],
    ],
    note: "Le tarif dépend du périmètre, du niveau de personnalisation et du nombre d'utilisateurs.",
  },
};

export function getStudioOfferTier(tierLevel: number): StudioOfferTier {
  const tier = STUDIO_OFFER_TIERS[tierLevel];
  if (!tier) {
    throw new Error(`Palier d'offre inconnu : ${tierLevel}`);
  }
  return tier;
}

export function getAllStudioOfferTiers(): StudioOfferTier[] {
  return [1, 2, 3, 4].map(getStudioOfferTier);
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
