"use client";

import { useActionState } from "react";
import { createLegalMonitoring } from "../actions";
import { TextField, TextAreaField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export default function NewMonitoringForm() {
  const [error, formAction, pending] = useActionState(createLegalMonitoring, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField label="Source" name="source" required placeholder="ex. Légifrance, URSSAF..." />
      <TextField label="Titre" name="title" required />
      <TextField label="Date du texte" name="text_date" type="date" />
      <TextAreaField label="Résumé" name="summary" rows={3} />
      <TextAreaField label="Impact pressenti" name="impact" rows={2} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-fit">
        {pending ? "Création..." : "Créer l'entrée"}
      </Button>
    </form>
  );
}
