"use client";

import { useState } from "react";
import { deleteQuestion } from "../actions";
import { Button } from "@/ui-kit/Button";

export default function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" className="text-xs" onClick={() => setConfirming(true)}>
        Supprimer
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">Confirmer la suppression ?</span>
      <Button
        type="button"
        variant="danger"
        className="text-xs"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await deleteQuestion(questionId);
          if (result) {
            setError(result);
            setPending(false);
          }
        }}
      >
        {pending ? "..." : "Oui, supprimer"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="text-xs"
        onClick={() => setConfirming(false)}
      >
        Annuler
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
