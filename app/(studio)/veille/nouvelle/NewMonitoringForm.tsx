"use client";

import { useActionState } from "react";
import { createLegalMonitoring } from "../actions";
import { TextField, TextAreaField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// Les 3 dates distinctes (date du texte / publication / entrée en
// vigueur) et le champ type/lien reprennent exactement l'éditeur du vrai
// prototype (openVeilleEditor/saveVeille, LBP_V2-20.html lignes
// 1979-1986) — legal_monitoring (colonnes de James) les a toutes, notre
// premier formulaire n'en exposait que 3 sur 7.
export default function NewMonitoringForm() {
  const [error, formAction, pending] = useActionState(createLegalMonitoring, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField label="Source" name="source" required placeholder="ex. Légifrance, URSSAF..." />
      <TextField
        label="Type de texte"
        name="text_type"
        placeholder="ex. Décret n°..., Arrêté du..., Doctrine BOSS..."
      />
      <TextField label="Titre" name="title" required />
      <div className="grid grid-cols-3 gap-2">
        <TextField label="Date du texte" name="text_date" type="date" />
        <TextField label="Publication" name="publication_date" type="date" />
        <TextField label="Entrée en vigueur" name="effective_date" type="date" />
      </div>
      <TextField
        label="Lien vers le texte officiel"
        name="link"
        type="url"
        placeholder="https://..."
      />
      <TextAreaField label="Résumé" name="summary" rows={3} />
      <TextAreaField label="Impact pressenti" name="impact" rows={2} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-fit">
        {pending ? "Création..." : "Créer l'entrée"}
      </Button>
    </form>
  );
}
