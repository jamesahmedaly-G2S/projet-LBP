/**
 * STU-DESIGN-01 : port 1:1 des variables CSS `:root` du vrai prototype
 * (`LBP_V6_Studio.html`, racine de `LBP_V2/`, section "LBP STUDIO : univers
 * bleu, lumineux et premium", lignes 22-33) — aucune couleur ajoutée,
 * conformément à `docs/ARCHITECTURE.md` §9 et au commentaire du prototype
 * lui-même ("aucune couleur ajoutée"). Source unique consommée à la fois
 * par `app/globals.css` (classes Tailwind `bg-studio-*`/`text-studio-*`,
 * via `@theme`) et par tout code JS/TS qui a besoin de la valeur hex brute
 * (ex. graphiques, styles inline) — les deux doivent rester synchronisés
 * avec ce fichier, jamais l'inverse.
 */
export const STUDIO_COLORS = {
  navy: "#14304F",
  navy2: "#1C3F63",
  navyMuted: "#A9C0D9",
  blue: "#2E5B87",
  blueSoft: "#E9F0FA",
  bg: "#E9EFF8",
  card: "#FFFFFF",
  line: "#D3DEEC",
  muted: "#6B7C93",
  green: "#6E9B6E",
  greenBg: "#EAF2EA",
  amber: "#D4A32E",
  amberBg: "#FBF3DE",
  red: "#C4544F",
  redBg: "#FAEAE9",
  violet: "#8C6FA8",
  violetBg: "#F2ECF7",
} as const;

export type StudioColor = keyof typeof STUDIO_COLORS;
