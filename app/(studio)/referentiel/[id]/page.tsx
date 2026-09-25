import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getWorkflowStatusLabel,
  getWorkflowStatusTone,
  type WorkflowStatus,
} from "@/lib/studio/workflow-status";
import type { SheetContent } from "@/lib/studio/placeholder-content";
import EditContentForm from "./EditContentForm";
import RenameForm from "./RenameForm";
import WorkflowActions from "./WorkflowActions";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

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
    .select("id, content, status, version")
    .eq("master_sheet_id", id)
    .eq("layer_kind", "rg")
    .order("version", { ascending: false })
    .limit(1)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm text-zinc-500">
        Identifiant stable : <span className="font-mono">{sheet.code}</span> (ne change jamais, y
        compris après renommage)
      </p>
      <div className="mt-1 flex items-center gap-3">
        <RenameForm sheetId={sheet.id} title={sheet.title} />
        <Badge tone={getWorkflowStatusTone(sheet.status)}>
          {getWorkflowStatusLabel(sheet.status)}
        </Badge>
      </div>

      {version ? (
        <Card className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Contenu de la couche régime général — version {version.version}
            </p>
            <Badge tone={getWorkflowStatusTone(version.status)}>
              {getWorkflowStatusLabel(version.status)}
            </Badge>
          </div>
          <div className="mb-5">
            <WorkflowActions versionId={version.id} status={version.status as WorkflowStatus} />
          </div>
          <EditContentForm versionId={version.id} content={version.content as SheetContent} />
        </Card>
      ) : (
        <p className="mt-6 text-sm text-red-600">
          Aucune version régime général trouvée pour cette fiche.
        </p>
      )}
    </main>
  );
}
