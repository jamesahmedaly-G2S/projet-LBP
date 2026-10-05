"use client";

import { useActionState } from "react";
import { transitionSheetVersion } from "../actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// STU-WORKFLOW-02 : un seul formulaire, deux boutons de soumission — le
// bouton activé fournit sa propre valeur pour `target_status` (comportement
// natif du DOM : le name/value du submitter cliqué est inclus dans le
// FormData), donc pas besoin de dupliquer le champ motif entre deux forms.
export default function ControlActions({ versionId }: { versionId: string }) {
  const [error, formAction, pending] = useActionState(transitionSheetVersion, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="version_id" value={versionId} />

      <div className="min-w-[220px] flex-1">
        <TextField label="Motif" name="motif" required placeholder="Raison de la décision" />
      </div>

      <Button
        type="submit"
        name="target_status"
        value="valid"
        variant="primary"
        disabled={pending}
        className="text-xs"
      >
        {pending ? "..." : "Valider"}
      </Button>
      <Button
        type="submit"
        name="target_status"
        value="draft"
        variant="secondary"
        disabled={pending}
        className="text-xs"
      >
        {pending ? "..." : "Renvoyer en brouillon"}
      </Button>

      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
