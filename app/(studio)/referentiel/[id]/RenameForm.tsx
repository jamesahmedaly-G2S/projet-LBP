"use client";

import { useActionState } from "react";
import { renameMasterSheet } from "../actions";
import { Button } from "@/ui-kit/Button";

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
        className="rounded-md border border-zinc-300 px-2 py-1 text-lg font-semibold text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        className="border border-zinc-200 text-xs"
      >
        {pending ? "..." : "Renommer"}
      </Button>
      {message && <span className="text-xs text-zinc-500">{message}</span>}
    </form>
  );
}
