"use client";

import { useActionState, useState } from "react";
import { transitionSheetVersion } from "../actions";
import type { ImpactedCompany } from "@/lib/studio/publication-impact";
import { Button } from "@/ui-kit/Button";

// STU-WORKFLOW-03 : remplace WorkflowActions pour les statuts valid/scheduled
// — les seules transitions possibles depuis ces statuts mènent à published,
// et le dossier (§12) rend l'aperçu "qui verra quoi" non négociable avant
// publication. Les boutons de publication n'existent tout simplement pas
// tant que l'aperçu n'a pas été ouvert (gate structurel, pas juste visuel).
export default function PublishPanel({
  versionId,
  status,
  impactedCompanies,
  scheduledAt,
}: {
  versionId: string;
  status: "valid" | "scheduled";
  impactedCompanies: ImpactedCompany[];
  scheduledAt: string | null;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [publishError, publishAction, publishPending] = useActionState(
    transitionSheetVersion,
    null,
  );
  const [scheduleError, scheduleAction, schedulePending] = useActionState(
    transitionSheetVersion,
    null,
  );

  if (status === "scheduled") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500">
          Programmée pour le{" "}
          {scheduledAt ? new Date(scheduledAt).toLocaleString("fr-FR") : "(date inconnue)"} — pas
          visible côté client avant cette échéance.
        </p>
        {!previewOpen ? (
          <Button
            type="button"
            variant="secondary"
            className="w-fit text-xs"
            onClick={() => setPreviewOpen(true)}
          >
            Voir l&apos;aperçu avant publication définitive
          </Button>
        ) : (
          <>
            <ImpactPreview companies={impactedCompanies} />
            <form action={publishAction} className="flex items-center gap-2">
              <input type="hidden" name="version_id" value={versionId} />
              <input type="hidden" name="target_status" value="published" />
              <Button type="submit" variant="primary" disabled={publishPending} className="text-xs">
                {publishPending ? "..." : "Publier maintenant"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() => setPreviewOpen(false)}
              >
                Fermer l&apos;aperçu
              </Button>
              {publishError && <span className="text-xs text-red-600">{publishError}</span>}
            </form>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!previewOpen ? (
        <Button
          type="button"
          variant="secondary"
          className="w-fit text-xs"
          onClick={() => setPreviewOpen(true)}
        >
          Voir qui sera impacté avant de publier
        </Button>
      ) : (
        <>
          <ImpactPreview companies={impactedCompanies} />

          <div className="flex flex-wrap items-center gap-2">
            <form action={publishAction} className="flex items-center gap-2">
              <input type="hidden" name="version_id" value={versionId} />
              <input type="hidden" name="target_status" value="published" />
              <Button type="submit" variant="primary" disabled={publishPending} className="text-xs">
                {publishPending ? "..." : "Publier maintenant"}
              </Button>
            </form>

            {!scheduling ? (
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                onClick={() => setScheduling(true)}
              >
                Programmer
              </Button>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              className="text-xs"
              onClick={() => {
                setPreviewOpen(false);
                setScheduling(false);
              }}
            >
              Fermer l&apos;aperçu
            </Button>
          </div>

          {publishError && <p className="text-xs text-red-600">{publishError}</p>}

          {scheduling && (
            <form action={scheduleAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="version_id" value={versionId} />
              <input type="hidden" name="target_status" value="scheduled" />
              <input
                type="datetime-local"
                name="scheduled_at"
                required
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={schedulePending}
                className="text-xs"
              >
                {schedulePending ? "..." : "Confirmer la programmation"}
              </Button>
              {scheduleError && <span className="text-xs text-red-600">{scheduleError}</span>}
            </form>
          )}
        </>
      )}
    </div>
  );
}

function ImpactPreview({ companies }: { companies: ImpactedCompany[] }) {
  if (companies.length === 0) {
    return (
      <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Aucune société impactée pour l&apos;instant (aucune ne correspond à cette couche/palier).
      </p>
    );
  }

  return (
    <div className="rounded-md bg-zinc-50 px-3 py-2">
      <p className="mb-1 text-xs font-medium text-zinc-600">
        {companies.length} société{companies.length > 1 ? "s" : ""} verra
        {companies.length > 1 ? "ront" : ""} cette version :
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-700">
        {companies.map((company) => (
          <li key={company.id}>{company.companyName}</li>
        ))}
      </ul>
    </div>
  );
}
