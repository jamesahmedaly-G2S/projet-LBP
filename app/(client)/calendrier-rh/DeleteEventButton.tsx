"use client";

import { useState } from "react";
import { deleteOwnEvent } from "./actions";

export default function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="text-xs text-danger hover:underline disabled:opacity-50"
      disabled={pending}
      onClick={async () => {
        if (!confirm(`Supprimer « ${title} » ?`)) return;
        setPending(true);
        await deleteOwnEvent(id);
        setPending(false);
      }}
    >
      Supprimer
    </button>
  );
}
