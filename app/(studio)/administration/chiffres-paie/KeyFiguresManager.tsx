"use client";

import { useActionState, useState, useTransition } from "react";
import { saveKeyFigure, deleteKeyFigure } from "./actions";
import { TextField, SelectField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export interface KeyFigureAdmin {
  id: string;
  key: string;
  year: number;
  value: number;
  unit: string;
  note: string | null;
  label: string | null;
  group_id: string | null;
  show_as_card: boolean;
  show_in_ceiling_table: boolean;
}

interface Group {
  id: string;
  title: string;
}

// STU-ADMIN (dans le cadre de LBP-CLIENT-05) : gère key_figures dans son
// ensemble — aussi bien les repères "cartes" (SMIC, plafonds...) que les
// lignes du tableau des périodicités. `label` prioritaire sur
// lib/client/key-figure-labels.ts côté affichage client : un nouveau
// repère a un vrai libellé dès sa création, sans changement de code.
export default function KeyFiguresManager({
  figures,
  groups,
}: {
  figures: KeyFigureAdmin[];
  groups: Group[];
}) {
  const [editing, setEditing] = useState<KeyFigureAdmin | "new" | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-studio-line text-left text-xs text-studio-muted">
            <th className="py-1.5 pr-2">Clé</th>
            <th className="px-2 py-1.5">Libellé</th>
            <th className="px-2 py-1.5">Année</th>
            <th className="px-2 py-1.5">Valeur affichée</th>
            <th className="px-2 py-1.5">Groupe</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {figures.map((f) => (
            <tr key={f.id} className="border-b border-studio-line">
              <td className="py-1.5 pr-2 font-mono text-xs text-studio-muted">{f.key}</td>
              <td className="px-2 py-1.5 text-studio-navy">{f.label ?? "—"}</td>
              <td className="px-2 py-1.5 text-studio-navy">{f.year}</td>
              <td className="px-2 py-1.5 font-mono text-studio-navy">
                {f.note ?? `${f.value} ${f.unit}`}
              </td>
              <td className="px-2 py-1.5 text-studio-muted">
                {groups.find((g) => g.id === f.group_id)?.title ?? "—"}
              </td>
              <td className="px-2 py-1.5 text-right">
                <button
                  type="button"
                  className="text-xs text-studio-blue hover:underline"
                  onClick={() => setEditing(f)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="ml-2 text-xs text-studio-red hover:underline"
                  onClick={() => {
                    if (confirm(`Supprimer « ${f.label ?? f.key} » (${f.year}) ?`)) {
                      startTransition(() => deleteKeyFigure(f.id));
                    }
                  }}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing ? (
        <KeyFigureForm
          figure={editing === "new" ? null : editing}
          groups={groups}
          onDone={() => setEditing(null)}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => setEditing("new")}
        >
          + Ajouter un repère
        </Button>
      )}
    </div>
  );
}

function KeyFigureForm({
  figure,
  groups,
  onDone,
}: {
  figure: KeyFigureAdmin | null;
  groups: Group[];
  onDone: () => void;
}) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveKeyFigure(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border border-studio-line p-3"
    >
      {figure && <input type="hidden" name="id" value={figure.id} />}
      <div className="flex flex-wrap gap-2">
        <TextField
          label="Clé technique"
          name="key"
          defaultValue={figure?.key}
          required
          readOnly={!!figure}
          className={`w-40 ${figure ? "bg-studio-bg" : ""}`}
          title={figure ? "La clé technique ne peut pas être modifiée après création." : undefined}
        />
        <TextField
          label="Libellé affiché"
          name="label"
          defaultValue={figure?.label ?? ""}
          required
          className="w-56"
        />
        <TextField
          label="Année"
          name="year"
          type="number"
          defaultValue={figure?.year}
          required
          className="w-24"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <TextField
          label="Valeur (nombre)"
          name="value"
          type="number"
          step="0.01"
          defaultValue={figure?.value}
          required
          className="w-32"
        />
        <TextField label="Unité" name="unit" defaultValue={figure?.unit ?? "€"} className="w-20" />
        <TextField
          label="Texte affiché (optionnel)"
          name="note"
          defaultValue={figure?.note ?? ""}
          placeholder="Ex. 12,02 € (janv.) · 12,31 € (juin)"
          className="w-64"
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <SelectField
          label="Groupe (carte comparative)"
          name="group_id"
          defaultValue={figure?.group_id ?? ""}
          className="w-56"
        >
          <option value="">— Aucun</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </SelectField>
        <CheckboxField
          label="Afficher en carte"
          name="show_as_card"
          defaultChecked={figure?.show_as_card ?? false}
        />
        <CheckboxField
          label="Afficher dans le tableau des périodicités"
          name="show_in_ceiling_table"
          defaultChecked={figure?.show_in_ceiling_table ?? false}
        />
      </div>
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
