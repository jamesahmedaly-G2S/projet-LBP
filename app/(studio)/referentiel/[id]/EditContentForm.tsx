"use client";

import { useActionState } from "react";
import { updateSheetContent } from "../actions";
import type { SheetContent } from "@/lib/studio/placeholder-content";

const FIELDS: { key: keyof SheetContent; label: string }[] = [
  { key: "essentiel", label: "L'essentiel à retenir" },
  { key: "comprendre", label: "Comprendre la règle" },
  { key: "maitriser", label: "Maîtriser la règle dans le détail" },
  { key: "application", label: "Comment l'appliquer concrètement en paie" },
  { key: "vigilance", label: "Points de vigilance" },
];

export default function EditContentForm({
  versionId,
  content,
}: {
  versionId: string;
  content: SheetContent;
}) {
  const [message, formAction, pending] = useActionState(updateSheetContent, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="version_id" value={versionId} />

      {FIELDS.map(({ key, label }) => (
        <label key={key} className="flex flex-col gap-1 text-sm text-zinc-700">
          {label}
          <textarea
            name={key}
            defaultValue={content[key]}
            rows={3}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
      ))}

      {message && <p className="text-sm text-zinc-600">{message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
