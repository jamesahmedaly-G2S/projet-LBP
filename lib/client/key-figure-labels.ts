/**
 * Libellés d'affichage des clés `key_figures` — source unique réutilisée
 * par l'Accueil (LBP-CLIENT-01) et Chiffres Paie (LBP-CLIENT-05), pour ne
 * jamais avoir deux libellés différents pour la même clé.
 */
export const KEY_FIGURE_LABELS: Record<string, string> = {
  "smic-h": "SMIC horaire brut",
  "smic-m": "SMIC mensuel brut (35 h)",
  "smic-net": "SMIC mensuel net estimé",
  pmss: "Plafond mensuel SS (PMSS)",
  pass: "Plafond annuel SS (PASS)",
  mg: "Minimum garanti (MG)",
  "an-repas-hcr": "Avantage en nature repas (HCR)",
  "gratification-stage": "Gratification min. de stage (/h)",
  "plafond-annuel": "Annuel (PASS)",
  "plafond-mensuel": "Mensuel (PMSS)",
  "plafond-trimestriel": "Trimestriel",
  "plafond-quinzaine": "Quinzaine",
  "plafond-hebdomadaire": "Hebdomadaire",
  "plafond-journalier": "Journalier",
  "plafond-horaire": "Horaire",
};

export const CEILING_TABLE_ORDER = [
  "pass",
  "pmss",
  "plafond-trimestriel",
  "plafond-quinzaine",
  "plafond-hebdomadaire",
  "plafond-journalier",
  "plafond-horaire",
];

export function keyFigureLabel(key: string): string {
  return KEY_FIGURE_LABELS[key] ?? key;
}
