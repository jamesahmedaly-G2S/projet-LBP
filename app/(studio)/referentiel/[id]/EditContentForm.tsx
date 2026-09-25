"use client";

import { useActionState } from "react";
import { updateSheetContent } from "../actions";
import type { SheetContent } from "@/lib/studio/placeholder-content";
import { TextAreaField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

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
        <TextAreaField key={key} label={label} name={key} defaultValue={content[key]} rows={3} />
      ))}

      {message && <p className="text-sm text-zinc-600">{message}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-fit">
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
