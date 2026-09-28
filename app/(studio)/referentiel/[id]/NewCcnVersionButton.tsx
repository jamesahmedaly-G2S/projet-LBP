"use client";

import { useActionState } from "react";
import { createNewCcnVersion } from "../actions";
import { Button } from "@/ui-kit/Button";

// Pendant de NewVersionButton.tsx pour une couche CCN (STU-CCN-03).
export default function NewCcnVersionButton({
  masterSheetId,
  ccnIdcc,
}: {
  masterSheetId: string;
  ccnIdcc: string;
}) {
  const [error, formAction, pending] = useActionState(createNewCcnVersion, null);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="master_sheet_id" value={masterSheetId} />
      <input type="hidden" name="ccn_idcc" value={ccnIdcc} />
      <p className="text-xs text-studio-muted">
        Cette version est déjà diffusée, son contenu est figé.
      </p>
      <Button type="submit" variant="secondary" disabled={pending} className="text-xs">
        {pending ? "..." : "Créer une nouvelle version pour la modifier"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
