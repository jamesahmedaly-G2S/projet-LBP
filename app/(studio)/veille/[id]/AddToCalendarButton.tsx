"use client";

import { useState, useTransition } from "react";
import { addVeilleToCalendar } from "../actions";
import { Button } from "@/ui-kit/Button";

// STU-VEILLE-01 (correctif) : port de veilleToCalendar() — un rappel
// personnel, pas un effet sur la fiche ou la qualification.
export default function AddToCalendarButton({ legalMonitoringId }: { legalMonitoringId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        className="text-xs"
        disabled={pending || message === "ok"}
        onClick={() =>
          startTransition(async () => {
            const error = await addVeilleToCalendar(legalMonitoringId);
            setMessage(error ?? "ok");
          })
        }
      >
        {pending ? "..." : message === "ok" ? "✓ Ajouté au calendrier" : "📅 Ajouter au calendrier"}
      </Button>
      {message && message !== "ok" && <p className="text-xs text-studio-red">{message}</p>}
    </div>
  );
}
