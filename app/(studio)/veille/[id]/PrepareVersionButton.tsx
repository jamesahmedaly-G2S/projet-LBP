"use client";

import { useActionState } from "react";
import { createNewVersion } from "../../referentiel/actions";
import { Button } from "@/ui-kit/Button";

// STU-VEILLE-03 : crée une sheet_versions en draft, legal_monitoring_id
// renseigné (createNewVersion, étendu depuis STU-WORKFLOW-04) — ne touche
// jamais la version publiée (§10). Le statut de la veille ne passe pas à
// "Traitée" ici : seulement quand cette version sera réellement publiée
// (transitionSheetVersion).
export default function PrepareVersionButton({
  legalMonitoringId,
  masterSheetId,
}: {
  legalMonitoringId: string;
  masterSheetId: string;
}) {
  const [error, formAction, pending] = useActionState(createNewVersion, null);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="master_sheet_id" value={masterSheetId} />
      <input type="hidden" name="legal_monitoring_id" value={legalMonitoringId} />
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "..." : "Préparer une nouvelle version"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
