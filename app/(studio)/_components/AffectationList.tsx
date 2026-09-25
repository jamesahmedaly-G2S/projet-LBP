import Link from "next/link";
import { getOriginLabel, type CompanyAffectation } from "@/lib/studio/affectations";
import { Badge } from "@/ui-kit/Badge";

// STU-AFFECT-02 / STU-AFFECT-04 : même rendu partout où une liste
// d'affectations est montrée (fiche client, vue globale) — pas de
// divergence possible entre les deux écrans.
export function AffectationList({ affectations }: { affectations: CompanyAffectation[] }) {
  const visible = affectations.filter((a) => !a.removedManually);
  const removed = affectations.filter((a) => a.removedManually);

  if (affectations.length === 0) {
    return <p className="text-sm text-zinc-400">Aucune fiche affectée pour l&apos;instant.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {visible.map((a) => (
          <li key={a.masterSheetId} className="flex items-start justify-between gap-3 text-sm">
            <Link
              href={`/referentiel/${a.masterSheetId}`}
              className="text-blue-700 hover:underline"
            >
              {a.title}
            </Link>
            <div className="flex flex-wrap justify-end gap-1">
              {a.origins.map((origin) => (
                <Badge key={origin} tone={origin === "manual" ? "amber" : "neutral"}>
                  {getOriginLabel(origin)}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {removed.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">
            Retirées manuellement (règle automatique conservée, non visible côté client)
          </p>
          <ul className="flex flex-col gap-1">
            {removed.map((a) => (
              <li
                key={a.masterSheetId}
                className="flex items-center justify-between gap-3 text-sm text-zinc-400 line-through"
              >
                <span>{a.title}</span>
                <Badge tone="red">Retirée</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
