import { STUDIO_SETTINGS } from "./settings";

export type EntretienTone = "vert" | "jaune" | "rouge";

export interface InterviewRow {
  status: "to_plan" | "planned" | "done" | "late";
  planned_at: string | null;
  completed_at: string | null;
}

export interface EntretienSummary {
  lastDoneDate: string | null;
  nextDueDate: string | null;
  daysUntilNext: number | null;
  tone: EntretienTone | null;
}

/** Port 1:1 de `daysUntil()` (LBP_V6_Studio.html) — dates au format ISO
 * `YYYY-MM-DD`, comparées à midi pour éviter tout écart de fuseau. */
function daysUntil(dateISO: string): number {
  const target = new Date(`${dateISO}T12:00:00`);
  const now = new Date();
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

/** Port 1:1 de `addMonths()`. */
function addMonths(dateISO: string, months: number): string {
  const d = new Date(`${dateISO}T12:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Port 1:1 de `entretienColor()` — mêmes seuils, mêmes comparaisons
 * (`<=`), pour ne jamais diverger de la référence réelle. */
export function getEntretienTone(dateISO: string): EntretienTone {
  const days = daysUntil(dateISO);
  if (days <= STUDIO_SETTINGS.entretienSeuilRouge) return "rouge";
  if (days <= STUDIO_SETTINGS.entretienSeuilJaune) return "jaune";
  return "vert";
}

/**
 * STU-CLIENT-02 : le prototype ne connaît qu'un `lastEntretien` unique et
 * calcule `nextEntretien` en mémoire (`addMonths`). Notre `company_interviews`
 * réel (STU-DATA-04) garde un historique complet avec un statut explicite
 * (`to_plan`/`planned`/`done`/`late`) — cette fonction en déduit le dernier
 * entretien réellement fait et le prochain à échéance :
 * - le prochain planifié explicitement (`planned`/`to_plan` le plus proche)
 *   prime toujours sur un calcul automatique ;
 * - sinon, un entretien `late` (planifié puis jamais réalisé) reste
 *   l'échéance à afficher (déjà en retard, donc forcément rouge) ;
 * - sinon, calculé depuis le dernier entretien réellement fait
 *   (`entretienPeriodeMois` plus tard), comme dans le prototype ;
 * - sans aucune donnée, retourne `tone: null` plutôt qu'une couleur
 *   inventée (ex. client tout juste créé par l'assistant, STU-CLIENT-01).
 */
export function summarizeEntretiens(rows: InterviewRow[]): EntretienSummary {
  const done = rows
    .filter((r) => r.status === "done" && r.completed_at)
    .sort((a, b) => (b.completed_at! > a.completed_at! ? 1 : -1));
  const lastDoneDate = done[0]?.completed_at ?? null;

  const upcoming = rows
    .filter((r) => (r.status === "planned" || r.status === "to_plan") && r.planned_at)
    .sort((a, b) => (a.planned_at! > b.planned_at! ? 1 : -1));
  const late = rows.filter((r) => r.status === "late" && r.planned_at);

  const nextDueDate =
    upcoming[0]?.planned_at ??
    late[0]?.planned_at ??
    (lastDoneDate ? addMonths(lastDoneDate, STUDIO_SETTINGS.entretienPeriodeMois) : null);

  return {
    lastDoneDate,
    nextDueDate,
    daysUntilNext: nextDueDate ? daysUntil(nextDueDate) : null,
    tone: nextDueDate ? getEntretienTone(nextDueDate) : null,
  };
}
