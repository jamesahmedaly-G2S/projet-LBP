"use client";

import { useActionState, useTransition } from "react";
import { addGroup, deleteGroup } from "./actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

interface Group {
  id: string;
  title: string;
  sub: string | null;
}

export default function GroupsManager({ groups }: { groups: Group[] }) {
  const [error, formAction, pending] = useActionState(addGroup, null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <ul className="flex flex-col gap-2 text-sm">
        {groups.map((g) => (
          <li
            key={g.id}
            className="flex items-center justify-between gap-2 rounded-md border border-studio-line px-3 py-2"
          >
            <span>
              <span className="font-medium text-studio-navy">{g.title}</span>
              {g.sub && <span className="ml-2 text-studio-muted">{g.sub}</span>}
            </span>
            <button
              type="button"
              className="text-xs text-studio-red hover:underline"
              onClick={() => {
                if (
                  confirm(
                    `Supprimer le groupe « ${g.title} » ? Les repères qu'il contient ne seront plus affichés en carte.`,
                  )
                ) {
                  startTransition(() => deleteGroup(g.id));
                }
              }}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
        <TextField label="Nouveau groupe" name="title" required className="w-40" />
        <TextField label="Sous-titre (optionnel)" name="sub" className="w-56" />
        <input type="hidden" name="display_order" value={groups.length} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "+ Ajouter un groupe"}
        </Button>
        {error && <p className="w-full text-xs text-studio-red">{error}</p>}
      </form>
    </div>
  );
}
