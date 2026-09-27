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
        className="rounded-md border border-studio-line px-2 py-1 text-lg font-semibold text-studio-navy focus:border-studio-blue focus:outline-none focus:ring-1 focus:ring-studio-blue"
      />
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        className="border border-studio-line text-xs"
      >
        {pending ? "..." : "Renommer"}
      </Button>
      {message && <span className="text-xs text-studio-muted">{message}</span>}
    </form>
  );
}
