"use client";

import { useActionState, useState } from "react";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export interface QuizFormValues {
  id?: string;
  title: string;
  description: string;
  questions: string;
  published: boolean;
  masterThemeId: string | null;
  masterSheetId: string | null;
}

const QUESTIONS_HINT = `Format : un bloc par question, séparé par une ligne vide.
- une option par ligne commençant par "-"
- "-*" pour la bonne réponse
- "> explication" (optionnel) pour la justification affichée en fin de quiz

Exemple :
Quel est le taux de la CSG déductible en 2026 ?
- 6,80 %
- *6,70 %
> La CSG déductible reste fixée à 6,70 % du revenu brut en 2026.`;

export default function QuizForm({
  action,
  initial,
  themes,
  sheets,
  submitLabel,
}: {
  action: (prevState: string | null, formData: FormData) => Promise<string | null>;
  initial: QuizFormValues;
  themes: { id: string; name: string }[];
  sheets: { id: string; code: string; title: string }[];
  submitLabel: string;
}) {
  const [message, formAction, pending] = useActionState(action, null);
  const [attachTo, setAttachTo] = useState<"theme" | "sheet">(
    initial.masterSheetId ? "sheet" : "theme",
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <TextField label="Titre" name="title" required defaultValue={initial.title} />
      <TextField
        label="Description (optionnelle)"
        name="description"
        defaultValue={initial.description}
      />

      <div>
        <p className="mb-1 text-sm font-medium text-studio-muted">Rattaché à</p>
        <div className="mb-2 flex gap-4 text-sm text-studio-navy">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={attachTo === "theme"}
              onChange={() => setAttachTo("theme")}
            />
            Un thème
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={attachTo === "sheet"}
              onChange={() => setAttachTo("sheet")}
            />
            Une fiche
          </label>
        </div>

        {attachTo === "theme" ? (
          <SelectField
            label="Thème"
            name="master_theme_id"
            required
            defaultValue={initial.masterThemeId ?? ""}
          >
            <option value="" disabled>
              Choisir un thème
            </option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectField>
        ) : (
          <SelectField
            label="Fiche"
            name="master_sheet_id"
            required
            defaultValue={initial.masterSheetId ?? ""}
          >
            <option value="" disabled>
              Choisir une fiche
            </option>
            {sheets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.code})
              </option>
            ))}
          </SelectField>
        )}
      </div>

      <TextAreaField
        label="Questions"
        name="questions"
        required
        rows={12}
        defaultValue={initial.questions}
        placeholder={QUESTIONS_HINT}
      />

      <CheckboxField label="Publié" name="published" defaultChecked={initial.published} />

      {message && <p className="text-sm text-studio-red">{message}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="w-fit">
        {pending ? "..." : submitLabel}
      </Button>
    </form>
  );
}
