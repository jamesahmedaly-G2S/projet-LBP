import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getWorkflowStatusLabel,
  getWorkflowStatusTone,
  type WorkflowStatus,
} from "@/lib/studio/workflow-status";
import { getLayerKindLabel } from "@/lib/studio/layer-kind";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

interface PublicationRow {
  id: string;
  master_sheet_id: string;
  layer_kind: string;
  version: number;
  status: string;
  motif: string | null;
  created_at: string;
  published_at: string | null;
  scheduled_at: string | null;
  master_sheets: { code: string; title: string } | null;
  profiles: { full_name: string } | null;
  sheet_version_recipients: { companies: { company_name: string } | null }[];
}

// STU-WORKFLOW-06 : vue transverse toutes fiches confondues, direct sur
// sheet_versions (pas de table/vue dédiée) — une version publiée via
// l'écran fiche (STU-WORKFLOW-01/03) apparaît ici sans étape
// supplémentaire, une seule source de vérité.
export default async function PublicationsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: versions } = await supabase
    .from("sheet_versions")
    .select(
      "id, master_sheet_id, layer_kind, version, status, motif, created_at, published_at, scheduled_at, master_sheets(code, title), profiles(full_name), sheet_version_recipients(companies(company_name))",
    )
    .in("status", ["valid", "scheduled", "published"])
    .returns<PublicationRow[]>();

  const rows = (versions ?? [])
    .map((row) => ({
      ...row,
      displayDate: row.published_at ?? row.scheduled_at ?? row.created_at,
    }))
    .sort((a, b) => new Date(b.displayDate).getTime() - new Date(a.displayDate).getTime());

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Publications</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Contenus validés, programmés et publiés, toutes fiches et couches confondues.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-zinc-400">Rien à afficher pour l&apos;instant.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {rows.map((row) => {
            const recipients = row.sheet_version_recipients
              .map((r) => r.companies?.company_name)
              .filter((name): name is string => Boolean(name))
              .sort();

            return (
              <Card key={row.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/referentiel/${row.master_sheet_id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {row.master_sheets?.title ?? "(fiche introuvable)"}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      <span className="font-mono">{row.master_sheets?.code}</span> ·{" "}
                      {getLayerKindLabel(row.layer_kind)} · version {row.version} ·{" "}
                      {row.profiles?.full_name ?? "auteur inconnu"}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {row.status === "published" &&
                        row.published_at &&
                        `Publiée le ${new Date(row.published_at).toLocaleString("fr-FR")}`}
                      {row.status === "scheduled" &&
                        row.scheduled_at &&
                        `Programmée pour le ${new Date(row.scheduled_at).toLocaleString("fr-FR")}`}
                      {row.status === "valid" &&
                        `Validée le ${new Date(row.created_at).toLocaleString("fr-FR")}`}
                    </p>
                    {row.motif && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Motif : <span className="italic">{row.motif}</span>
                      </p>
                    )}
                  </div>
                  <Badge tone={getWorkflowStatusTone(row.status as WorkflowStatus)}>
                    {getWorkflowStatusLabel(row.status)}
                  </Badge>
                </div>

                {row.status === "published" && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-zinc-500">Sociétés réceptrices</p>
                    {recipients.length === 0 ? (
                      <p className="text-xs text-zinc-400">Aucune.</p>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {recipients.map((name) => (
                          <Badge key={name} tone="neutral">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
