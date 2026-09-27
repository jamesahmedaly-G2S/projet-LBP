"use client";

import { useActionState } from "react";
import { transitionSheetVersion } from "../actions";
import { ALLOWED_TRANSITIONS } from "@/lib/studio/workflow-transitions";
import { getWorkflowStatusLabel, type WorkflowStatus } from "@/lib/studio/workflow-status";
import { Button } from "@/ui-kit/Button";

// STU-WORKFLOW-01 : un bouton par transition valide depuis le statut
// courant — le graphe (lib/studio/workflow-transitions.ts) est l'unique
// source de vérité, ce composant ne fait qu'itérer dessus.
export default function WorkflowActions({
  versionId,
  status,
}: {
  versionId: string;
  status: WorkflowStatus;
}) {
  const [error, formAction, pending] = useActionState(transitionSheetVersion, null);
  const nextStatuses = ALLOWED_TRANSITIONS[status] ?? [];

  if (nextStatuses.length === 0) {
    return (
      <p className="text-xs text-studio-muted">Statut terminal, aucune transition possible.</p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatuses.map((next) => (
        <form action={formAction} key={next}>
          <input type="hidden" name="version_id" value={versionId} />
          <input type="hidden" name="target_status" value={next} />
          <Button
            type="submit"
            variant="secondary"
            disabled={pending}
            aria-busy={pending}
            className="text-xs"
          >
            → {getWorkflowStatusLabel(next)}
          </Button>
        </form>
      ))}
      {pending && (
        <span className="text-xs text-studio-muted" role="status">
          Enregistrement en cours...
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
