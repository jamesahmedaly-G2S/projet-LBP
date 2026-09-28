"use client";

import { useActionState } from "react";
import { createCcnLayer } from "../actions";
import { SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export default function AddCcnLayerForm({
  masterSheetId,
  availableCcns,
}: {
  masterSheetId: string;
  availableCcns: { idcc: string; name: string }[];
}) {
  const [error, formAction, pending] = useActionState(createCcnLayer, null);

  if (availableCcns.length === 0) {
    return (
      <p className="text-xs text-studio-muted">
        Toutes les CCN du catalogue ont déjà une couche sur cette fiche.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="master_sheet_id" value={masterSheetId} />
      <div className="min-w-[260px]">
        <SelectField label="Ajouter une couche CCN" name="ccn_idcc" required defaultValue="">
          <option value="" disabled>
            Choisir une CCN
          </option>
          {availableCcns.map((c) => (
            <option key={c.idcc} value={c.idcc}>
              {c.name} ({c.idcc})
            </option>
          ))}
        </SelectField>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "..." : "Ajouter"}
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
