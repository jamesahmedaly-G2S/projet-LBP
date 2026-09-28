"use client";

import { useState, useTransition } from "react";
import { markOfferRequest } from "./actions";
import { Button } from "@/ui-kit/Button";

export default function OfferRequestActions({
  id,
  status,
}: {
  id: string;
  status: "pending" | "contacted" | "closed";
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === "closed") return null;

  function mark(next: "contacted" | "closed") {
    startTransition(async () => {
      setError(await markOfferRequest(id, next));
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {status === "pending" && (
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            disabled={pending}
            onClick={() => mark("contacted")}
          >
            Marquer contacté
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="text-xs"
          disabled={pending}
          onClick={() => mark("closed")}
        >
          Clôturer
        </Button>
      </div>
      {error && <p className="text-xs text-studio-red">{error}</p>}
    </div>
  );
}
