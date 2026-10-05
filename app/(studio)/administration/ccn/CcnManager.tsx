"use client";

import { useActionState, useState, useTransition } from "react";
import { saveCcn, deleteCcn } from "./actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export interface CcnAdmin {
  idcc: string;
  name: string;
}

export default function CcnManager({ items }: { items: CcnAdmin[] }) {
  const [editing, setEditing] = useState<CcnAdmin | "new" | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-studio-line text-left text-xs text-studio-muted">
            <th className="py-1.5 pr-2">IDCC</th>
            <th className="px-2 py-1.5">Convention collective</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.idcc} className="border-b border-studio-line">
              <td className="py-1.5 pr-2 font-mono text-studio-navy">{c.idcc}</td>
              <td className="px-2 py-1.5 text-studio-navy">{c.name}</td>
              <td className="px-2 py-1.5 text-right">
                <button
                  type="button"
                  className="text-xs text-studio-blue hover:underline"
                  onClick={() => setEditing(c)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="ml-2 text-xs text-studio-red hover:underline"
                  onClick={() => {
                    if (confirm(`Supprimer « ${c.name} » (IDCC ${c.idcc}) du catalogue ?`)) {
                      startTransition(async () => setDeleteError(await deleteCcn(c.idcc)));
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
      {deleteError && <p className="mt-2 text-xs text-studio-red">{deleteError}</p>}

      {editing ? (
        <CcnForm item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => setEditing("new")}
        >
          + Ajouter une convention collective
        </Button>
      )}
    </div>
  );
}

function CcnForm({ item, onDone }: { item: CcnAdmin | null; onDone: () => void }) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveCcn(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-wrap items-end gap-2 rounded-md border border-studio-line p-3"
    >
      {item && <input type="hidden" name="original_idcc" value={item.idcc} />}
      <TextField
        label="IDCC"
        name="idcc"
        defaultValue={item?.idcc ?? ""}
        required
        className="w-28"
      />
      <TextField
        label="Nom de la convention"
        name="name"
        defaultValue={item?.name ?? ""}
        required
        className="w-64"
      />
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "..." : "Enregistrer"}
      </Button>
      <Button type="button" variant="ghost" onClick={onDone}>
        Annuler
      </Button>
      {error && <p className="w-full text-xs text-studio-red">{error}</p>}
    </form>
  );
}
