"use client";

import { useState, useTransition } from "react";
import { requestOfferChange } from "./actions";
import { Button } from "@/ui-kit/Button";

// Texte de confirmation repris du vrai requestUpgrade() (LBP_V6_Studio.html,
// ligne 5087-5090) : "les droits restent inchangés" tant que G2S n'a pas
// traité la demande — cohérent avec le garde-fou déjà en place côté
// serveur (offer_change_requests, jamais companies.offer_tier).
export default function RequestOfferButton({
  targetTier,
  label,
}: {
  targetTier: number;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <p className="text-xs text-success">
        Votre demande a bien été transmise à G2S. Un conseiller vous recontactera — votre offre
        actuelle reste inchangée tant que le changement n&apos;est pas confirmé.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="primary"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const err = await requestOfferChange(targetTier);
            if (err) setError(err);
            else setSent(true);
          })
        }
      >
        {pending ? "..." : (label ?? "Demander cette offre")}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
