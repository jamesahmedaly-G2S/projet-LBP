"use client";

import { useActionState, useState } from "react";
import { updateQuestion } from "../actions";
import { TextField, SelectField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import type { QuestionType } from "@/lib/studio/question-type";
import { QUESTION_TYPE_LABELS } from "@/lib/studio/question-type";

interface Question {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options: string[] | null;
  condition_question_code: string | null;
  condition_value: string | null;
  display_order: number;
}

export default function EditQuestionForm({
  question,
  existingQuestions,
}: {
  question: Question;
  existingQuestions: { code: string; label: string }[];
}) {
  const [message, formAction, pending] = useActionState(updateQuestion, null);
  const [type, setType] = useState<QuestionType>(question.type as QuestionType);
  const [hasCondition, setHasCondition] = useState(Boolean(question.condition_question_code));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={question.id} />
      <TextField label="Libellé" name="label" required defaultValue={question.label} />

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
          defaultValue={(question.options ?? []).join(", ")}
        />
      )}

      <CheckboxField
        label="Réponse obligatoire"
        name="required"
        defaultChecked={question.required}
      />

      <CheckboxField
        label="Question conditionnelle"
        checked={hasCondition}
        onChange={(e) => setHasCondition(e.target.checked)}
      />
      {hasCondition && (
        <div className="grid grid-cols-2 gap-2 rounded-md bg-studio-bg p-3">
          <SelectField
            label="Visible si..."
            name="condition_question_code"
            defaultValue={question.condition_question_code ?? ""}
          >
            <option value="" disabled>
              Choisir une question
            </option>
            {existingQuestions.map((q) => (
              <option key={q.code} value={q.code}>
                {q.label}
              </option>
            ))}
          </SelectField>
          <TextField
            label="...vaut"
            name="condition_value"
            defaultValue={question.condition_value ?? ""}
          />
        </div>
      )}

      <TextField
        label="Ordre d'affichage"
        name="display_order"
        type="number"
        defaultValue={question.display_order}
      />

      {message && <p className="text-sm text-studio-muted">{message}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-fit">
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
