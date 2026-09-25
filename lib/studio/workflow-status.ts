/**
 * Libellés d'affichage des 7 statuts du workflow Studio
 * (`workflow_status`, cf. STU-DATA-02). Source unique réutilisée par tous
 * les écrans Studio qui affichent un statut (référentiel, publications,
 * contrôle G2S...).
 */
export type WorkflowStatus =
  "draft" | "review" | "valid" | "scheduled" | "published" | "historized" | "archived";

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  draft: "Brouillon",
  review: "À vérifier",
  valid: "Validé",
  scheduled: "Programmé",
  published: "Publié",
  historized: "Historisé",
  archived: "Archivé",
};

export function getWorkflowStatusLabel(status: string): string {
  return WORKFLOW_STATUS_LABELS[status as WorkflowStatus] ?? status;
}

/** Teinte de badge (ui-kit/Badge) associée à chaque statut, même source partout. */
export const WORKFLOW_STATUS_TONES: Record<
  WorkflowStatus,
  "neutral" | "blue" | "green" | "amber" | "red"
> = {
  draft: "neutral",
  review: "amber",
  valid: "blue",
  scheduled: "blue",
  published: "green",
  historized: "neutral",
  archived: "red",
};

export function getWorkflowStatusTone(status: string) {
  return WORKFLOW_STATUS_TONES[status as WorkflowStatus] ?? "neutral";
}
