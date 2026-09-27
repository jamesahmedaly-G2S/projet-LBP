"use client";

import { useActionState, useState } from "react";
import { createQuestion } from "../actions";
import { TextField, SelectField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import type { QuestionType } from "@/lib/studio/question-type";
import { QUESTION_TYPE_LABELS } from "@/lib/studio/question-type";

export default function NewQuestionForm({
  existingQuestions,
}: {
  existingQuestions: { code: string; label: string }[];
}) {
  const [error, formAction, pending] = useActionState(createQuestion, null);
  const [type, setType] = useState<QuestionType>("bool");
  const [hasCondition, setHasCondition] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        label="Code (identifiant stable)"
        name="code"
        required
        placeholder="ex. q_teletravail"
      />
      <TextField label="Libellé" name="label" required />

      <SelectField
        label="Type"
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as QuestionType)}
      >
        {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>

      {type === "select" && (
        <TextField
          label="Options (séparées par des virgules)"
          name="options"
          placeholder="ex. Moins de 11, 11 à 49, 50 à 249, 250 et plus"
        />
      )}

      <CheckboxField label="Réponse obligatoire" name="required" />

      <CheckboxField
        label="Question conditionnelle"
        checked={hasCondition}
        onChange={(e) => setHasCondition(e.target.checked)}
      />
      {hasCondition && (
        <div className="grid grid-cols-2 gap-2 rounded-md bg-zinc-50 p-3">
          <SelectField label="Visible si..." name="condition_question_code" defaultValue="">
            <option value="" disabled>
              Choisir une question
            </option>
            {existingQuestions.map((q) => (
              <option key={q.code} value={q.code}>
                {q.label}
              </option>
            ))}
          </SelectField>
          <TextField label="...vaut" name="condition_value" placeholder="ex. oui" />
        </div>
      )}

      <TextField label="Ordre d'affichage" name="display_order" type="number" defaultValue="0" />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-fit">
        {pending ? "Création..." : "Créer la question"}
      </Button>
    </form>
  );
}
