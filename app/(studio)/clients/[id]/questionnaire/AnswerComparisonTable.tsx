import type { AnswerComparisonRow } from "@/lib/studio/answer-comparison";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

// STU-QUEST-03 : chaque ligne modifiée pendant l'entretien en cours est
// visuellement distinguée (fond ambré + badge "Modifié") des réponses
// inchangées — critère d'acceptation explicite du ticket.
export default function AnswerComparisonTable({
  rows,
  labelByCode,
}: {
  rows: AnswerComparisonRow[];
  labelByCode: Record<string, string>;
}) {
  if (rows.length === 0) {
    return null;
  }

  const changedCount = rows.filter((r) => r.changed).length;

  return (
    <Card className="mb-6">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-medium text-zinc-600">
          Comparaison avant / pendant l&apos;entretien
        </h2>
        <Badge tone={changedCount > 0 ? "amber" : "neutral"}>
          {changedCount} réponse{changedCount > 1 ? "s" : ""} modifiée{changedCount > 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="overflow-hidden rounded-md border border-zinc-100">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs text-zinc-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Question</th>
              <th className="px-3 py-2 text-left font-medium">Avant</th>
              <th className="px-3 py-2 text-left font-medium">Pendant l&apos;entretien</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.questionCode}
                className={row.changed ? "bg-amber-50" : "border-t border-zinc-50"}
              >
                <td className="px-3 py-2 text-zinc-700">
                  {labelByCode[row.questionCode] ?? row.questionCode}
                </td>
                <td className="px-3 py-2 text-zinc-500">{row.before ?? "—"}</td>
                <td className="px-3 py-2">
                  {row.changed ? (
                    <span className="font-medium text-amber-700">{row.after ?? "—"}</span>
                  ) : (
                    <span className="text-zinc-500">{row.after ?? "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
