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
        <h2 className="text-sm font-medium text-studio-muted">
          Comparaison avant / pendant l&apos;entretien
        </h2>
        <Badge tone={changedCount > 0 ? "amber" : "neutral"}>
          {changedCount} réponse{changedCount > 1 ? "s" : ""} modifiée{changedCount > 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="overflow-hidden rounded-md border border-studio-line">
        <table className="w-full text-sm">
          <thead className="bg-studio-bg text-xs text-studio-muted">
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
                className={row.changed ? "bg-amber-50" : "border-t border-studio-line"}
              >
                <td className="px-3 py-2 text-studio-navy">
                  {labelByCode[row.questionCode] ?? row.questionCode}
                </td>
                <td className="px-3 py-2 text-studio-muted">{row.before ?? "—"}</td>
                <td className="px-3 py-2">
                  {row.changed ? (
                    <span className="font-medium text-amber-700">{row.after ?? "—"}</span>
                  ) : (
                    <span className="text-studio-muted">{row.after ?? "—"}</span>
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
