"use client";

import { useActionState, useState } from "react";
import { addQuestionImpact, removeQuestionImpact } from "../actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";

interface Impact {
  id: string;
  answerValue: string;
  sheetTitle: string;
  sheetCode: string;
}

export default function ImpactsSection({
  questionId,
  questionCode,
  impacts,
  sheets,
}: {
  questionId: string;
  questionCode: string;
  impacts: Impact[];
  sheets: { id: string; code: string; title: string }[];
}) {
  const [error, formAction, pending] = useActionState(addQuestionImpact, null);

  return (
    <div className="flex flex-col gap-3">
      {impacts.length === 0 ? (
        <p className="text-sm text-studio-muted">Aucune fiche déclenchée pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {impacts.map((impact) => (
            <ImpactRow key={impact.id} impact={impact} questionId={questionId} />
          ))}
        </ul>
      )}

      <form
        action={formAction}
        className="flex flex-wrap items-end gap-2 border-t border-studio-line pt-3"
      >
        <input type="hidden" name="question_code" value={questionCode} />
        <input type="hidden" name="question_id" value={questionId} />
        <div className="min-w-[140px]">
          <TextField label="Réponse" name="answer_value" required placeholder="ex. oui" />
        </div>
        <div className="min-w-[220px] flex-1">
          <SelectField label="Fiche déclenchée" name="master_sheet_id" required defaultValue="">
            <option value="" disabled>
              Choisir une fiche
            </option>
            {sheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.title} ({sheet.code})
              </option>
            ))}
          </SelectField>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "Ajouter"}
        </Button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ImpactRow({ impact, questionId }: { impact: Impact; questionId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-studio-navy">
        <Badge tone="blue">{impact.answerValue}</Badge> → {impact.sheetTitle}{" "}
        <span className="font-mono text-xs text-studio-muted">({impact.sheetCode})</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        className="text-xs"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await removeQuestionImpact(impact.id, questionId);
          setPending(false);
        }}
      >
        {pending ? "..." : "Retirer"}
      </Button>
    </li>
  );
}
