"use client";

import { useActionState } from "react";
import { parseUploadedDocx, type ParsePreviewResult } from "./actions";
import CcnResolutionPanel from "./CcnResolutionPanel";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";

const SECTION_LABELS: Record<string, string> = {
  essentiel: "L'essentiel à retenir",
  comprendre: "Comprendre la règle",
  maitriser: "Maîtriser la règle dans le détail",
  application: "Application concrète en paie",
  vigilance: "Points de vigilance",
  quiz: "Quiz",
};

const initialState: ParsePreviewResult = {
  error: null,
  parsed: null,
  ccnMatches: null,
  ccnCatalog: null,
};

export default function ImportWordForm() {
  const [state, formAction, pending] = useActionState(parseUploadedDocx, initialState);

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-studio-muted">
          Fichier .docx
          <input
            type="file"
            name="file"
            accept=".docx"
            required
            className="text-sm text-studio-navy"
          />
        </label>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Analyse..." : "Analyser"}
        </Button>
      </form>

      {state.error && <p className="mt-3 text-sm text-studio-red">{state.error}</p>}

      {state.parsed && (
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-studio-muted">Fiche détectée</p>
            <p className="text-sm text-studio-navy">
              {state.parsed.numeroFiche ? (
                <>
                  <b>{state.parsed.numeroFiche}</b> — {state.parsed.titre}
                </>
              ) : (
                <>
                  Aucun numéro de fiche détecté (attendu : &laquo;&nbsp;NN.NN — Titre&nbsp;&raquo;)
                  — titre lu : {state.parsed.titre ?? "—"}
                </>
              )}
            </p>
          </div>

          <CcnResolutionPanel matches={state.ccnMatches ?? []} catalog={state.ccnCatalog ?? []} />

          <div>
            <p className="text-xs uppercase tracking-wide text-studio-muted">
              Sections détectées ({state.parsed.sections.length})
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {state.parsed.sections.map((s, i) => (
                <div key={i} className="rounded-md border border-studio-line p-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-studio-navy">{s.headingText}</p>
                    {s.field ? (
                      <Badge tone="blue">{SECTION_LABELS[s.field]}</Badge>
                    ) : (
                      <Badge tone="amber">Rubrique non reconnue</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-studio-muted">
                    {s.blocks.length} bloc(s) — {s.blocks.filter((b) => b.type === "table").length}{" "}
                    tableau(x), {s.blocks.filter((b) => b.type === "list-item").length} élément(s)
                    de liste
                  </p>
                  {s.blocks.slice(0, 2).map((b, bi) =>
                    b.type === "table" ? (
                      <p key={bi} className="mt-1 text-xs text-studio-muted italic">
                        Tableau : {b.table.headers.join(" | ")} ({b.table.rows.length} ligne(s))
                      </p>
                    ) : (
                      <p key={bi} className="mt-1 truncate text-xs text-studio-muted">
                        {b.type === "list-item" ? "• " : ""}
                        {b.text}
                      </p>
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
