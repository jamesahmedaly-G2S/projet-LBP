"use client";

import { useState, useTransition } from "react";
import { analyzeEntryWithAi } from "../actions";
import type { AiAnalysisResult } from "@/lib/studio/monitoring-ai-analysis";
import { Button } from "@/ui-kit/Button";

// STU-VEILLE-04 (AUTOMATION-03, #87) : affiche le vrai résultat renvoyé par
// le serveur (jamais une analyse inventée) — aujourd'hui toujours
// "non configuré" tant qu'ANTHROPIC_API_KEY n'existe pas ; prêt à afficher
// une vraie analyse dès qu'une clé est configurée.
export default function AnalyzeButton({ legalMonitoringId }: { legalMonitoringId: string }) {
  const [result, setResult] = useState<AiAnalysisResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="ghost"
        className="text-xs"
        disabled={pending}
        onClick={() =>
          startTransition(async () => setResult(await analyzeEntryWithAi(legalMonitoringId)))
        }
      >
        {pending ? "..." : "Analyser avec l'IA"}
      </Button>
      {result?.message && <p className="text-xs text-zinc-500">{result.message}</p>}
      {result?.status === "ok" && result.analysis && (
        <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
          <p>
            <span className="font-medium">{result.analysis.type}</span> — {result.analysis.intitule}
          </p>
          <p className="mt-1">{result.analysis.resume}</p>
          <p className="mt-1 text-zinc-500">Impact : {result.analysis.impactRhPaie}</p>
        </div>
      )}
    </div>
  );
}
