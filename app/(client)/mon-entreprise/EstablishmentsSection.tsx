"use client";

import { useActionState, useTransition } from "react";
import { addEstablishment, deleteEstablishment } from "./actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

interface Establishment {
  id: string;
  name: string;
  address: string | null;
}

export default function EstablishmentsSection({
  establishments,
}: {
  establishments: Establishment[];
}) {
  const [error, formAction, pending] = useActionState(addEstablishment, null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <ul className="flex flex-col gap-2 text-sm">
        {establishments.length === 0 && (
          <li className="text-muted">Aucun établissement renseigné.</li>
        )}
        {establishments.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
          >
            <span>
              <span className="font-medium text-ink">{e.name}</span>
              {e.address && <span className="ml-2 text-muted">{e.address}</span>}
            </span>
            <button
              type="button"
              className="text-xs text-danger hover:underline"
              onClick={() => startTransition(() => deleteEstablishment(e.id))}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
        <TextField label="Nom / ville" name="name" required className="w-40" />
        <TextField label="Adresse" name="address" className="w-56" />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "+ Ajouter"}
        </Button>
        {error && <p className="w-full text-xs text-danger">{error}</p>}
      </form>
    </div>
  );
}
