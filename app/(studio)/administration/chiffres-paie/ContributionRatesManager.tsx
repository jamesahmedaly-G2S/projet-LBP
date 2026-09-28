"use client";

import { useActionState, useState, useTransition } from "react";
import { saveContributionRate, deleteContributionRate } from "./actions";
import { TextField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export interface ContributionRateAdmin {
  id: string;
  category: string | null;
  label: string;
  base: string | null;
  employee_rate: string | null;
  employer_rate: string | null;
  is_header: boolean;
  display_order: number;
}

export default function ContributionRatesManager({ rows }: { rows: ContributionRateAdmin[] }) {
  const [editing, setEditing] = useState<ContributionRateAdmin | "new" | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="max-h-96 overflow-y-auto rounded-md border border-studio-line">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-studio-line text-left text-xs text-studio-muted">
              <th className="py-1.5 pr-2 pl-2">Libellé</th>
              <th className="px-2 py-1.5">Base</th>
              <th className="px-2 py-1.5">Salariale</th>
              <th className="px-2 py-1.5">Patronale</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-studio-line">
                <td
                  className={`py-1.5 pr-2 pl-2 ${r.is_header ? "font-semibold text-studio-navy" : "text-studio-navy"}`}
                >
                  {r.is_header && "— "}
                  {r.label}
                </td>
                <td className="px-2 py-1.5 text-studio-muted">{r.base}</td>
                <td className="px-2 py-1.5 font-mono text-studio-navy">{r.employee_rate}</td>
                <td className="px-2 py-1.5 font-mono text-studio-navy">{r.employer_rate}</td>
                <td className="px-2 py-1.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="text-xs text-studio-blue hover:underline"
                    onClick={() => setEditing(r)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-xs text-studio-red hover:underline"
                    onClick={() => {
                      if (confirm(`Supprimer « ${r.label} » ?`))
                        startTransition(() => deleteContributionRate(r.id));
                    }}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <ContributionForm
          row={editing === "new" ? null : editing}
          nextOrder={rows.length}
          onDone={() => setEditing(null)}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => setEditing("new")}
        >
          + Ajouter une ligne
        </Button>
      )}
    </div>
  );
}

function ContributionForm({
  row,
  nextOrder,
  onDone,
}: {
  row: ContributionRateAdmin | null;
  nextOrder: number;
  onDone: () => void;
}) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveContributionRate(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border border-studio-line p-3"
    >
      {row && <input type="hidden" name="id" value={row.id} />}
      <input type="hidden" name="display_order" value={row?.display_order ?? nextOrder} />
      <CheckboxField
        label="C'est un en-tête de catégorie (ex. « Retraite »)"
        name="is_header"
        defaultChecked={row?.is_header ?? false}
      />
      <TextField label="Libellé" name="label" defaultValue={row?.label ?? ""} required />
      <div className="flex flex-wrap gap-2">
        <TextField
          label="Assiette / base"
          name="base"
          defaultValue={row?.base ?? ""}
          className="w-56"
        />
        <TextField
          label="Taux salarial"
          name="employee_rate"
          defaultValue={row?.employee_rate ?? ""}
          placeholder="— ou 6,80 %"
          className="w-32"
        />
        <TextField
          label="Taux patronal"
          name="employer_rate"
          defaultValue={row?.employer_rate ?? ""}
          placeholder="— ou 8,55 %"
          className="w-32"
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
