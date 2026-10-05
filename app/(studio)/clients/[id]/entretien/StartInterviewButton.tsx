"use client";

import { useTransition } from "react";
import { startInterview } from "./actions";
import { Button } from "@/ui-kit/Button";

// Port de `stStartEntretien()` — reprend un entretien déjà commencé et non
// terminé pour cette société, ou en crée un nouveau (actions.ts).
export default function StartInterviewButton({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      className="text-xs"
      disabled={pending}
      onClick={() => startTransition(() => startInterview(companyId))}
    >
      {pending ? "..." : "Préparer l'entretien annuel"}
    </Button>
  );
}
