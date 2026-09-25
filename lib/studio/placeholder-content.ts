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

export function buildPlaceholderContent(title: string): SheetContent {
  return {
    essentiel: `[À rédiger] Résumé de "${title}" en 2-3 phrases.`,
    comprendre: `[À rédiger] Explication de la règle générale applicable à "${title}".`,
    maitriser: `[À rédiger] Détail complet de la règle, cas particuliers.`,
    application: `[À rédiger] Comment appliquer "${title}" concrètement en paie.`,
    vigilance: `[À rédiger] Points de vigilance et erreurs fréquentes.`,
  };
}
