"use client";

import { useActionState } from "react";
import { renameMasterSheet } from "../actions";

// STU-REF-03 : formulaire de renommage volontairement séparé de l'édition
// du contenu (EditContentForm) — le titre change, le code jamais.
export default function RenameForm({ sheetId, title }: { sheetId: string; title: string }) {
  const [message, formAction, pending] = useActionState(renameMasterSheet, null);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="sheet_id" value={sheetId} />
      <input
        name="title"
        defaultValue={title}
        className="rounded border border-zinc-300 px-2 py-1 text-lg font-semibold text-zinc-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 disabled:opacity-50"
      >
        {pending ? "..." : "Renommer"}
      </button>
      {message && <span className="text-xs text-zinc-500">{message}</span>}
    </form>
  );
}
