// LBP-CLIENT-15 : vocabulaire du Calendrier RH, porté depuis le vrai
// prototype (LBP_V9.9_Studio.html, THEMES_CAL/EVCOL/scopeLbl) mais mappé
// sur les vraies valeurs d'énum de calendar_events.event_type/scope
// (schéma réel de James, anglaises : baseline_schema_reel.sql) plutôt que
// les libellés français utilisés comme valeurs dans le prototype.
export type CalendarEventType = "mandatory" | "advisory" | "news";
export type CalendarEventScope = "national" | "company" | "personal";

export const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  mandatory: "Obligatoire",
  advisory: "Conseil",
  news: "Actualité",
};

// Couleurs portées 1:1 depuis EVCOL (LBP_V9.9_Studio.html).
export const EVENT_TYPE_COLOR: Record<CalendarEventType, string> = {
  mandatory: "#E48AAA",
  advisory: "#E8C24A",
  news: "#A98BD6",
};

export const EVENT_SCOPE_LABEL: Record<CalendarEventScope, string> = {
  national: "National",
  company: "Mon entreprise",
  personal: "Personnel",
};

// THEMES_CAL du prototype (LBP_V9.9_Studio.html) -- reprises telles
// quelles comme valeurs de calendar_events.category (colonne texte libre,
// pas d'énum dédiée côté schéma réel).
export const CALENDAR_THEMES = [
  "QVCT",
  "Marque employeur & recrutement",
  "Rémunération & avantages",
  "Diversité & inclusion",
  "Santé & prévention",
  "Engagement & RSE",
  "Formation & compétences",
  "Paie & déclaratif",
  "Jours fériés",
] as const;

// Thème de repli pour un rappel personnel sans thématique métier
// particulière -- même valeur que le prototype (themeSel ajoute toujours
// cette option en plus de THEMES_CAL).
export const PERSONAL_REMINDER_THEME = "Rappel personnel";

export const PRIORITY_LABEL: Record<number, string> = {
  1: "basse",
  2: "normale",
  3: "haute",
};
