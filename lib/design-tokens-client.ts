/**
 * Port 1:1 des variables CSS `:root` du vrai prototype LBP Client
 * (`Nouveau dossier/LBP_V2-20.html`, lignes 12-33 — le fichier lui-même dit
 * "Palette strictement identique à lbp-vitrine.html — aucune couleur
 * ajoutée"). Pendant de `lib/design-tokens.ts` (Studio), pour la charte
 * visuelle distincte exigée par STU-DESIGN-01 ("visuellement distinct du
 * LBP Client au premier coup d'œil") : sauge/encre/crème plutôt que le
 * bleu navy du Studio. Source unique consommée par `app/globals.css`
 * (bloc `.theme-client`, classes Tailwind `bg-primary`/`text-ink`...,
 * partagées avec `ui-kit/` — jamais un deuxième `ui-kit/` pour le client).
 */
export const CLIENT_COLORS = {
  sage: "#B8C4AC",
  sageDeep: "#6F8657",
  sageDarker: "#4F6139",
  ink: "#181818",
  inkSoft: "#78766E",
  bg: "#F5F3EE",
  panel: "#E7E4DC",
  card: "#FFFFFF",
  border: "#E7E3D9",
  red: "#C24A3A",
  pastelBlue: "#CBD9E3",
} as const;

export type ClientColor = keyof typeof CLIENT_COLORS;
