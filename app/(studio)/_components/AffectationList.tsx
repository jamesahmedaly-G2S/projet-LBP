"use client";

import { useState } from "react";
import Link from "next/link";
import { getOriginLabel, type CompanyAffectation } from "@/lib/studio/affectations";
import { Badge } from "@/ui-kit/Badge";
import { Button } from "@/ui-kit/Button";
import { setSheetOverride, clearSheetOverride } from "../clients/actions";

// STU-AFFECT-02 / STU-AFFECT-03 / STU-AFFECT-04 : même rendu partout où une
// liste d'affectations est montrée (fiche client, vue globale) — pas de
// divergence possible entre les écrans. `companyId` présent => actions
// manuelles (STU-AFFECT-03) affichées ; absent => lecture seule.
export function AffectationList({
  affectations,
  companyId,
}: {
  affectations: CompanyAffectation[];
  companyId?: string;
}) {
  const visible = affectations.filter((a) => !a.removedManually);
  const removed = affectations.filter((a) => a.removedManually);

  if (affectations.length === 0) {
    return <p className="text-sm text-zinc-400">Aucune fiche affectée pour l&apos;instant.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {visible.map((a) => (
          <AffectationRow key={a.masterSheetId} affectation={a} companyId={companyId} />
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
                className="flex items-center justify-between gap-3 text-sm text-zinc-400"
              >
                <span className="line-through">{a.title}</span>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {a.origins.map((origin) => (
                    <Badge key={origin} tone="neutral">
                      {getOriginLabel(origin)}
                    </Badge>
                  ))}
                  <Badge tone="red">Retirée</Badge>
                  {companyId && (
                    <RestoreButton companyId={companyId} masterSheetId={a.masterSheetId} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AffectationRow({
  affectation,
  companyId,
}: {
  affectation: CompanyAffectation;
  companyId?: string;
}) {
  const [showReason, setShowReason] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitRemove(formData: FormData) {
    setPending(true);
    const result = await setSheetOverride(null, formData);
    setPending(false);
    if (result) {
      setError(result);
    } else {
      setShowReason(false);
    }
  }

  return (
    <li className="flex flex-col gap-1 border-b border-zinc-50 pb-2 text-sm last:border-0">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/referentiel/${affectation.masterSheetId}`}
          className="text-blue-700 hover:underline"
        >
          {affectation.title}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {affectation.origins.map((origin) => (
            <Badge key={origin} tone={origin === "manual" ? "amber" : "neutral"}>
              {getOriginLabel(origin)}
            </Badge>
          ))}
          {companyId && !showReason && (
            <Button
              type="button"
              variant="ghost"
              className="text-xs"
              onClick={() => setShowReason(true)}
            >
              Retirer
            </Button>
          )}
        </div>
      </div>

      {companyId && showReason && (
        <form action={submitRemove} className="flex items-center gap-2">
          <input type="hidden" name="company_id" value={companyId} />
          <input type="hidden" name="master_sheet_id" value={affectation.masterSheetId} />
          <input type="hidden" name="action" value="remove" />
          <input
            name="reason"
            required
            placeholder="Motif du retrait (obligatoire)"
            className="flex-1 rounded-md border border-zinc-300 px-2 py-1 text-xs"
          />
          <Button type="submit" variant="secondary" className="text-xs" disabled={pending}>
            {pending ? "..." : "Confirmer"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={() => setShowReason(false)}
          >
            Annuler
          </Button>
        </form>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

function RestoreButton({ companyId, masterSheetId }: { companyId: string; masterSheetId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      className="text-xs"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await clearSheetOverride(companyId, masterSheetId);
        setPending(false);
      }}
    >
      {pending ? "..." : "Annuler le retrait"}
    </Button>
  );
}
