"use client";

import { useActionState } from "react";
import { createNewVersion } from "../actions";
import { Button } from "@/ui-kit/Button";

// STU-WORKFLOW-04 : seule façon de modifier une fiche déjà diffusée — le
// contenu de la version verrouillée n'est plus éditable en place (voir
// updateSheetContent, refus serveur).
export default function NewVersionButton({ masterSheetId }: { masterSheetId: string }) {
  const [error, formAction, pending] = useActionState(createNewVersion, null);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="master_sheet_id" value={masterSheetId} />
      <p className="text-xs text-zinc-500">
        Cette version est déjà diffusée, son contenu est figé.
      </p>
      <Button type="submit" variant="secondary" disabled={pending} className="text-xs">
        {pending ? "..." : "Créer une nouvelle version pour la modifier"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
