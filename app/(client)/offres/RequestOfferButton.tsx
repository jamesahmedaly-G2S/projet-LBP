"use client";

import { useState, useTransition } from "react";
import { requestOfferChange } from "./actions";
import { Button } from "@/ui-kit/Button";

export default function RequestOfferButton({ targetTier }: { targetTier: number }) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return <p className="text-xs text-success">Demande envoyée.</p>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        className="text-xs"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const err = await requestOfferChange(targetTier);
            if (err) setError(err);
            else setSent(true);
          })
        }
      >
        {pending ? "..." : "Demander cette offre"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
