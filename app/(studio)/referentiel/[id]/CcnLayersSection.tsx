import { getWorkflowStatusLabel, getWorkflowStatusTone } from "@/lib/studio/workflow-status";
import type { SheetContent } from "@/lib/studio/placeholder-content";
import type { ImpactedCompany } from "@/lib/studio/publication-impact";
import EditContentForm from "./EditContentForm";
import WorkflowActions from "./WorkflowActions";
import PublishPanel from "./PublishPanel";
import NewCcnVersionButton from "./NewCcnVersionButton";
import AddCcnLayerForm from "./AddCcnLayerForm";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

interface CcnLayer {
  id: string;
  content: SheetContent;
  status: "draft" | "review" | "valid" | "scheduled" | "published" | "historized" | "archived";
  version: number;
  ccn_idcc: string;
  ccnName: string;
  scheduled_at: string | null;
  impactedCompanies: ImpactedCompany[];
}

// STU-CCN-03 (scénario C) : une couche CCN par fiche a son propre cycle de
// statuts, totalement indépendant de la couche régime général —
// WorkflowActions/PublishPanel/EditContentForm sont déjà génériques
// (STU-WORKFLOW-01/03), réutilisés ici tels quels, jamais une deuxième
// implémentation du workflow.
export default function CcnLayersSection({
  masterSheetId,
  layers,
  availableCcns,
}: {
  masterSheetId: string;
  layers: CcnLayer[];
  availableCcns: { idcc: string; name: string }[];
}) {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-studio-navy">
        Couches conventionnelles (CCN)
      </h2>

      {layers.length === 0 && (
        <p className="mb-3 text-sm text-studio-muted">
          Aucune couche CCN sur cette fiche pour l&apos;instant.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {layers.map((layer) => (
          <Card key={layer.ccn_idcc}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-studio-muted">
                {layer.ccnName} ({layer.ccn_idcc}) — version {layer.version}
              </p>
              <Badge tone={getWorkflowStatusTone(layer.status)}>
                {getWorkflowStatusLabel(layer.status)}
              </Badge>
            </div>
            <div className="mb-5">
              {layer.status === "valid" || layer.status === "scheduled" ? (
                <PublishPanel
                  versionId={layer.id}
                  status={layer.status}
                  impactedCompanies={layer.impactedCompanies}
                  scheduledAt={layer.scheduled_at}
                />
              ) : (
                <WorkflowActions versionId={layer.id} status={layer.status} />
              )}
            </div>
            {["published", "historized", "archived"].includes(layer.status) ? (
              <NewCcnVersionButton masterSheetId={masterSheetId} ccnIdcc={layer.ccn_idcc} />
            ) : (
              <EditContentForm versionId={layer.id} content={layer.content} />
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <AddCcnLayerForm masterSheetId={masterSheetId} availableCcns={availableCcns} />
      </Card>
    </div>
  );
}
