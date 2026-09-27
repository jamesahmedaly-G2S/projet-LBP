/**
 * Contenu factice pour une nouvelle fiche maître. Le dossier Studio est
 * explicite : "Ne rédige pas maintenant tout le contenu juridique des
 * fiches" (§8 du prompt) — une fiche créée par ce module ne doit jamais
 * ressembler à du contenu réel, pour qu'on ne la confonde pas avec une
 * fiche prête à publier.
 */
export interface SheetContent {
  essentiel: string;
  comprendre: string;
  maitriser: string;
  application: string;
  vigilance: string;
}

/** Libellés des 5 niveaux (§ prototype `--lbp-essentiel`/`--lbp-comprendre`/
 * ... dans LBP_V6_Studio.html) — source unique, réutilisée par le
 * formulaire d'édition (Référentiel) et la vue client en lecture seule
 * (STU-CLIENT-04) : jamais deux listes de libellés qui pourraient diverger. */
export const SHEET_CONTENT_FIELDS: { key: keyof SheetContent; label: string }[] = [
  { key: "essentiel", label: "L'essentiel à retenir" },
  { key: "comprendre", label: "Comprendre la règle" },
  { key: "maitriser", label: "Maîtriser la règle dans le détail" },
  { key: "application", label: "Comment l'appliquer concrètement en paie" },
  { key: "vigilance", label: "Points de vigilance" },
];

export function buildPlaceholderContent(title: string): SheetContent {
  return {
    essentiel: `[À rédiger] Résumé de "${title}" en 2-3 phrases.`,
    comprendre: `[À rédiger] Explication de la règle générale applicable à "${title}".`,
    maitriser: `[À rédiger] Détail complet de la règle, cas particuliers.`,
    application: `[À rédiger] Comment appliquer "${title}" concrètement en paie.`,
    vigilance: `[À rédiger] Points de vigilance et erreurs fréquentes.`,
  };
}
