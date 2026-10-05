"use client";

import { useActionState, useState, useTransition } from "react";
import { saveTerm, deleteTerm } from "./actions";
import { TextField, TextAreaField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";

export interface DictionaryTermAdmin {
  id: string;
  term: string;
  definition: string;
  source: string | null;
  published: boolean;
}

export default function TermsManager({ terms }: { terms: DictionaryTermAdmin[] }) {
  const [editing, setEditing] = useState<DictionaryTermAdmin | "new" | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <ul className="flex flex-col gap-2 text-sm">
        {terms.map((t) => (
          <li key={t.id} className="rounded-md border border-studio-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-medium text-studio-navy">{t.term}</span>
                {!t.published && <Badge tone="amber">brouillon</Badge>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="text-xs text-studio-blue hover:underline"
                  onClick={() => setEditing(t)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="text-xs text-studio-red hover:underline"
                  onClick={() => {
                    if (confirm(`Supprimer « ${t.term} » du dictionnaire ?`)) {
                      startTransition(() => deleteTerm(t.id));
                    }
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
            <p className="mt-1 text-studio-navy">{t.definition}</p>
            {t.source && (
              <p className="mt-1 text-xs italic text-studio-muted">Source : {t.source}</p>
            )}
          </li>
        ))}
      </ul>

      {editing ? (
        <TermForm term={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => setEditing("new")}
        >
          + Ajouter un terme
        </Button>
      )}
    </div>
  );
}

function TermForm({ term, onDone }: { term: DictionaryTermAdmin | null; onDone: () => void }) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveTerm(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border border-studio-line p-3"
    >
      {term && <input type="hidden" name="id" value={term.id} />}
      <TextField label="Terme" name="term" defaultValue={term?.term ?? ""} required />
      <TextAreaField
        label="Définition"
        name="definition"
        defaultValue={term?.definition ?? ""}
        rows={3}
        required
      />
      <TextField
        label="Source (optionnel)"
        name="source"
        defaultValue={term?.source ?? ""}
        placeholder="Ex. BOSS, URSSAF, Code du travail…"
      />
      <CheckboxField
        label="Publié (visible côté client) — sinon, brouillon visible uniquement ici"
        name="published"
        defaultChecked={term?.published ?? true}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-studio-red">{error}</p>}
    </form>
  );
}
