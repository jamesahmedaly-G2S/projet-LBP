"use client";

import { useActionState } from "react";
import { setSheetOverride } from "../actions";
import { SelectField, TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// STU-AFFECT-03 : ajout manuel d'une fiche non affectée automatiquement —
// ne propose que les fiches absentes de la liste courante, pour éviter un
// doublon inutile avec l'origine "base"/"questionnaire"/"ccn".
export function AddOverrideForm({
  companyId,
  availableSheets,
}: {
  companyId: string;
  availableSheets: { id: string; code: string; title: string }[];
}) {
  const [error, formAction, pending] = useActionState(setSheetOverride, null);

  if (availableSheets.length === 0) {
    return <p className="text-xs text-zinc-400">Toutes les fiches publiées sont déjà affectées.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="action" value="add" />

      <div className="min-w-[220px]">
        <SelectField
          label="Fiche à ajouter manuellement"
          name="master_sheet_id"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Choisir une fiche
          </option>
          {availableSheets.map((sheet) => (
            <option key={sheet.id} value={sheet.id}>
              {sheet.title}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="min-w-[220px] flex-1">
        <TextField
          label="Motif"
          name="reason"
          required
          placeholder="Demande spécifique du client"
        />
      </div>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "..." : "Ajouter"}
      </Button>

      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
