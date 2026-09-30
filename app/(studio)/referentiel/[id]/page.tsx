import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getWorkflowStatusLabel,
  getWorkflowStatusTone,
  type WorkflowStatus,
} from "@/lib/studio/workflow-status";
import type { SheetContent } from "@/lib/studio/placeholder-content";
import { getImpactedCompanies } from "@/lib/studio/publication-impact";
import EditContentForm from "./EditContentForm";
import RenameForm from "./RenameForm";
import WorkflowActions from "./WorkflowActions";
import PublishPanel from "./PublishPanel";
import NewVersionButton from "./NewVersionButton";
import CcnLayersSection from "./CcnLayersSection";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { LinkButton } from "@/ui-kit/LinkButton";

interface CcnLayerVersion {
  id: string;
  content: SheetContent;
  status: WorkflowStatus;
  version: number;
  ccn_idcc: string;
  scheduled_at: string | null;
}

export default async function FichePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("master_sheets")
    .select("id, code, title, status")
    .eq("id", id)
    .single();

  if (!sheet) {
    notFound();
  }

  // Toujours la version "rg" la plus récente par numéro de version — après
  // une publication, l'ancienne devient "historized" (STU-WORKFLOW-01),
  // celle-ci reste la version courante affichée/éditable.
  const { data: version } = await supabase
    .from("sheet_versions")
    .select(
      "id, content, status, version, layer_kind, ccn_idcc, company_id, scheduled_at, internal_annexe",
    )
    .eq("master_sheet_id", id)
    .eq("layer_kind", "rg")
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const impactedCompanies =
    version && (version.status === "valid" || version.status === "scheduled")
      ? await getImpactedCompanies(supabase, {
          layerKind: version.layer_kind,
          ccnIdcc: version.ccn_idcc,
          companyId: version.company_id,
        })
      : [];

  // STU-CCN-03 : toutes les versions "ccn" de cette fiche, réduites à la
  // plus récente par CCN (même principe que la couche rg ci-dessus, mais
  // répété une fois par ccn_idcc — chaque CCN a son propre cycle de
  // statuts indépendant).
  const [{ data: ccnCatalog }, { data: allCcnVersions }] = await Promise.all([
    supabase.from("ccn_catalog").select("idcc, name").order("name"),
    supabase
      .from("sheet_versions")
      .select("id, content, status, version, ccn_idcc, scheduled_at")
      .eq("master_sheet_id", id)
      .eq("layer_kind", "ccn")
      .order("version", { ascending: false })
      .returns<CcnLayerVersion[]>(),
  ]);

  const latestByCcn = new Map<string, CcnLayerVersion>();
  for (const v of allCcnVersions ?? []) {
    if (!latestByCcn.has(v.ccn_idcc)) {
      latestByCcn.set(v.ccn_idcc, v);
    }
  }
  const ccnLayers = await Promise.all(
    Array.from(latestByCcn.values()).map(async (v) => ({
      ...v,
      ccnName: (ccnCatalog ?? []).find((c) => c.idcc === v.ccn_idcc)?.name ?? v.ccn_idcc,
      impactedCompanies:
        v.status === "valid" || v.status === "scheduled"
          ? await getImpactedCompanies(supabase, {
              layerKind: "ccn",
              ccnIdcc: v.ccn_idcc,
              companyId: null,
            })
          : [],
    })),
  );
  const availableCcns = (ccnCatalog ?? []).filter((c) => !latestByCcn.has(c.idcc));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm text-studio-muted">
        Identifiant stable : <span className="font-mono">{sheet.code}</span> (ne change jamais, y
        compris après renommage)
      </p>
      <div className="mt-1 flex items-center gap-3">
        <RenameForm sheetId={sheet.id} title={sheet.title} />
        <Badge tone={getWorkflowStatusTone(sheet.status)}>
          {getWorkflowStatusLabel(sheet.status)}
        </Badge>
        <LinkButton
          href={`/referentiel/${sheet.id}/historique`}
          variant="secondary"
          className="text-xs"
        >
          Historique
        </LinkButton>
      </div>

      {version ? (
        <Card className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-studio-muted">
              Contenu de la couche régime général — version {version.version}
            </p>
            <Badge tone={getWorkflowStatusTone(version.status)}>
              {getWorkflowStatusLabel(version.status)}
            </Badge>
          </div>
          <div className="mb-5">
            {version.status === "valid" || version.status === "scheduled" ? (
              <PublishPanel
                versionId={version.id}
                status={version.status}
                impactedCompanies={impactedCompanies}
                scheduledAt={version.scheduled_at}
              />
            ) : (
              <WorkflowActions versionId={version.id} status={version.status as WorkflowStatus} />
            )}
          </div>
          {["published", "historized", "archived"].includes(version.status) ? (
            <NewVersionButton masterSheetId={sheet.id} />
          ) : (
            <EditContentForm versionId={version.id} content={version.content as SheetContent} />
          )}
          {version.internal_annexe && (
            <div className="mt-5 rounded-md border border-studio-line bg-studio-bg p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-studio-muted">
                Annexe interne G2S (STU-IMPORT-05 — jamais visible côté client)
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-studio-navy">
                {version.internal_annexe}
              </p>
            </div>
          )}
        </Card>
      ) : (
        <p className="mt-6 text-sm text-red-600">
          Aucune version régime général trouvée pour cette fiche.
        </p>
      )}

      <CcnLayersSection
        masterSheetId={sheet.id}
        layers={ccnLayers}
        availableCcns={availableCcns ?? []}
      />
    </main>
  );
}
