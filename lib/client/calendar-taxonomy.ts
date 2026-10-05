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

// Correctif (04/10/2026), suite au retour de l'utilisateur ("regarde
// aussi la page calendrier RH mot pour mot") : libellés approximés,
// jamais vérifiés contre le vrai `scopeLbl` de `renderDayModal()`
// (~L3406) -- "National" devait être "National / général", "Mon
// entreprise" devait être "Entreprise" (le vrai code n'ajoute jamais
// "Mon" devant).
export const EVENT_SCOPE_LABEL: Record<CalendarEventScope, string> = {
  national: "National / général",
  company: "Entreprise",
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

// Partagé entre CalendarContent.tsx (/calendrier-rh) et CompactCalendar.tsx
// (widget compact de l'Accueil) -- jamais deux copies de ce mapping. Tons
// sémantiques V37 (voir calendrier-rh/CalendarContent.tsx), pas les
// couleurs propres EVCOL du prototype (EVENT_TYPE_COLOR ci-dessus),
// délibérément pour rester cohérent avec le reste du LBP Client re-thémé.
export const TYPE_BADGE_TONE: Record<CalendarEventType, "red" | "amber" | "blue"> = {
  mandatory: "red",
  advisory: "amber",
  news: "blue",
};

// Classes Tailwind complètes (jamais interpolées : le JIT de Tailwind ne
// détecte pas `bg-${x}`, seulement des classes littérales présentes dans
// le source).
export const TYPE_DOT_CLASS: Record<CalendarEventType, string> = {
  mandatory: "bg-danger",
  advisory: "bg-warning",
  news: "bg-primary",
};
