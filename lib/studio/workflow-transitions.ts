import type { WorkflowStatus } from "./workflow-status";

/**
 * Graphe des transitions valides du workflow à 7 statuts (§9 du dossier
 * Studio). "historized" n'apparaît jamais comme cible manuelle : c'est un
 * effet de bord automatique de la publication d'une nouvelle version de la
 * même couche/clé (voir transitionSheetVersion), pas une action choisie.
 */
export const ALLOWED_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ["review"],
  review: ["draft", "valid"],
  valid: ["scheduled", "published"],
  scheduled: ["published"],
  published: ["archived"],
  historized: ["archived"],
  archived: [],
};

export function isValidTransition(from: WorkflowStatus, to: WorkflowStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
