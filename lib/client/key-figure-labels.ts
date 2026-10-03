/**
 * Libellés d'affichage des clés `key_figures` — source unique réutilisée
 * par l'Accueil (LBP-CLIENT-01) et Chiffres Paie (LBP-CLIENT-05), pour ne
 * jamais avoir deux libellés différents pour la même clé.
 */
export const KEY_FIGURE_LABELS: Record<string, string> = {
  "smic-h": "SMIC horaire brut",
  "smic-m": "SMIC mensuel brut (35 h)",
  "smic-net": "SMIC mensuel net estimé",
  pmss: "Plafond mensuel (PMSS)",
  pass: "Plafond annuel (PASS)",
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

// Ordre réel des cartes comparatives (var CHIFFRES.groups,
// LBP_V9.9_Studio.html ~L4443-4454) -- un simple `.sort()` alphabétique
// donnait "Plafond annuel (PASS)" avant "Plafond mensuel (PMSS)" (inversé)
// et "Avantage en nature repas" / "Gratification..." / "Minimum garanti"
// dans le désordre pour le groupe "Autres repères" (ordre réel : MG,
// Avantage repas, Gratification stage). Note : cet ordre diffère
// délibérément de CEILING_TABLE_ORDER ci-dessus (pmss/pass y sont dans
// l'autre sens) -- les deux blocs du prototype (cartes vs tableau
// plafond) ont chacun leur propre ordre réel, pas le même.
export const CARD_KEY_ORDER = [
  "smic-h",
  "smic-m",
  "smic-net",
  "pmss",
  "pass",
  "mg",
  "an-repas-hcr",
  "gratification-stage",
];

/**
 * `dbLabel` (la colonne `key_figures.label`) est prioritaire quand
 * renseignée — un repère ajouté par G2S depuis l'écran d'admin a un
 * libellé réel dès sa création, jamais besoin d'un changement de code
 * pour l'afficher correctement.
 */
export function keyFigureLabel(key: string, dbLabel?: string | null): string {
  return dbLabel || KEY_FIGURE_LABELS[key] || key;
}
