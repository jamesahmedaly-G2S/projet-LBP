"use client";

import { useTransition } from "react";
import { completeInterview } from "../actions";
import { Button } from "@/ui-kit/Button";

// Port de entApply() — confirmation explicite avant de terminer
// l'entretien, comme dans le prototype réel (confirm() avant publication).
export default function CompleteInterviewButton({
  companyId,
  interviewId,
}: {
  companyId: string;
  interviewId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="primary"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Appliquer les modifications et publier vers l'espace client ?"))
          return;
        startTransition(() => {
          void completeInterview(companyId, interviewId);
        });
      }}
    >
      {pending ? "..." : "Soumettre au contrôle G2S et publier"}
    </Button>
  );
}
