"use client";

import { useActionState, useState } from "react";
import { saveCompanyAnswers } from "../../actions";
import { getVisibleQuestions } from "@/lib/studio/visible-questions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export interface FormQuestion {
  code: string;
  type: string;
  label: string;
  required: boolean;
  options: string[] | null;
  condition_question_code: string | null;
  condition_value: string | null;
}

// STU-QUEST-02 : composant réutilisable — même formulaire pour la saisie
// initiale (STU-CLIENT-01, étape 3, pas de `interviewId`) et pour un
// entretien annuel (STU-INTERVIEW-02, `interviewId` renseigné). Les
// questions de type `ccn` sont exclues (fournies déjà filtrées par
// l'appelant) : la sélection de CCN reste gérée par `CcnSection`
// (STU-CCN-02), jamais dupliquée ici — reproduit `qs.filter(q =>
// q.type!=='ccn')` de `stOpenQuest()` dans LBP_V6_Studio.html.
export default function QuestionnaireForm({
  companyId,
  interviewId,
  questions,
  initialAnswers,
}: {
  companyId: string;
  interviewId?: string;
  questions: FormQuestion[];
  initialAnswers: Record<string, string>;
}) {
  const [message, formAction, pending] = useActionState(saveCompanyAnswers, null);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);

  const visible = getVisibleQuestions(questions, answers);
  const requiredCodes = visible.filter((q) => q.required).map((q) => q.code);

  function setAnswer(code: string, value: string) {
    setAnswers((prev) => ({ ...prev, [code]: value }));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="company_id" value={companyId} />
      {interviewId && <input type="hidden" name="interview_id" value={interviewId} />}
      <input type="hidden" name="required_codes" value={requiredCodes.join(",")} />

      {visible.map((q) => (
        <QuestionField
          key={q.code}
          question={q}
          value={answers[q.code] ?? ""}
          onChange={(v) => setAnswer(q.code, v)}
        />
      ))}

      {message && <p className="text-sm text-red-600">{message}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-fit">
        {pending ? "Enregistrement..." : "Enregistrer les réponses"}
      </Button>
    </form>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: FormQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const name = `answer__${question.code}`;

  if (question.type === "bool") {
    return (
      <SelectField
        label={question.label}
        name={name}
        required={question.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Choisir —</option>
        <option value="oui">Oui</option>
        <option value="non">Non</option>
      </SelectField>
    );
  }

  if (question.type === "select") {
    return (
      <SelectField
        label={question.label}
        name={name}
        required={question.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Choisir —</option>
        {(question.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </SelectField>
    );
  }

  return (
    <TextField
      label={question.label}
      name={name}
      required={question.required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
