"use client";

import { useActionState } from "react";
import { transitionSheetVersion } from "../actions";
import { ALLOWED_TRANSITIONS } from "@/lib/studio/workflow-transitions";
import { getWorkflowStatusLabel, type WorkflowStatus } from "@/lib/studio/workflow-status";

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
    return <p className="text-xs text-zinc-400">Statut terminal, aucune transition possible.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nextStatuses.map((next) => (
        <form action={formAction} key={next}>
          <input type="hidden" name="version_id" value={versionId} />
          <input type="hidden" name="target_status" value={next} />
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 disabled:cursor-wait disabled:opacity-50"
          >
            → {getWorkflowStatusLabel(next)}
          </button>
        </form>
      ))}
      {pending && (
        <span className="text-xs text-zinc-500" role="status">
          Enregistrement en cours...
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
