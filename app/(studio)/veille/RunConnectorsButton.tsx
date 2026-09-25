"use client";

import { useState, useTransition } from "react";
import { runConnectorsNow } from "./actions";
import type { ConnectorResult } from "@/lib/studio/monitoring-connectors";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";

const STATUS_TONE: Record<ConnectorResult["status"], "green" | "amber" | "red"> = {
  ok: "green",
  not_configured: "amber",
  error: "red",
};
const STATUS_LABEL: Record<ConnectorResult["status"], string> = {
  ok: "Actif",
  not_configured: "Non configuré",
  error: "Erreur",
};

// STU-VEILLE-04 : lance réellement les 7 connecteurs (fetch HTTP réel pour
// Ministère du travail, statut honnête pour les 6 autres) et affiche le
// résultat exact renvoyé par le serveur — jamais un état optimiste inventé
// côté client.
export default function RunConnectorsButton() {
  const [results, setResults] = useState<ConnectorResult[] | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => setResults(await runConnectorsNow()))}
        className="w-fit"
      >
        {pending ? "Détection en cours..." : "Lancer la détection maintenant"}
      </Button>

      {results && (
        <ul className="flex flex-col gap-1">
          {results.map((result) => (
            <li key={result.key} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-700">
                {result.label}
                {result.status === "ok" &&
                  ` — ${result.itemsInserted} nouvelle(s) sur ${result.itemsFound} vue(s)`}
                {result.message && <span className="text-zinc-400"> — {result.message}</span>}
              </span>
              <Badge tone={STATUS_TONE[result.status]}>{STATUS_LABEL[result.status]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
