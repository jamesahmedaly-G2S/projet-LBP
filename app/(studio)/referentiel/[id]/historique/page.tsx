import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getWorkflowStatusLabel,
  getWorkflowStatusTone,
  type WorkflowStatus,
} from "@/lib/studio/workflow-status";
import { getLayerKindLabel } from "@/lib/studio/layer-kind";
import type { SheetContent } from "@/lib/studio/placeholder-content";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

const CONTENT_FIELDS: { key: keyof SheetContent; label: string }[] = [
  { key: "essentiel", label: "L'essentiel à retenir" },
  { key: "comprendre", label: "Comprendre la règle" },
  { key: "maitriser", label: "Maîtriser la règle dans le détail" },
  { key: "application", label: "Comment l'appliquer concrètement en paie" },
  { key: "vigilance", label: "Points de vigilance" },
];

interface HistoryRow {
  id: string;
  layer_kind: string;
  version: number;
  status: string;
  motif: string | null;
  created_at: string;
  published_at: string | null;
  scheduled_at: string | null;
  content: SheetContent;
  profiles: { full_name: string } | null;
  sheet_version_recipients: { companies: { company_name: string } | null }[];
}

// STU-WORKFLOW-04 : historique complet par fiche, toutes couches et tous
// statuts confondus (pas seulement les publiées) — scénario E du dossier :
// "consulter version actuelle et version précédente, voir auteur, date,
// motif et clients diffusés". Le contenu exact de chaque version reste
// accessible (repliable), donc rien n'est perdu quand une nouvelle version
// historise l'ancienne (STU-WORKFLOW-01).
export default async function HistoriquePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("master_sheets")
    .select("id, code, title")
    .eq("id", id)
    .single();

  if (!sheet) {
    notFound();
  }

  const { data: versions } = await supabase
    .from("sheet_versions")
    .select(
      "id, layer_kind, version, status, motif, created_at, published_at, scheduled_at, content, profiles(full_name), sheet_version_recipients(companies(company_name))",
    )
    .eq("master_sheet_id", id)
    .order("layer_kind")
    .order("version", { ascending: false })
    .returns<HistoryRow[]>();

  const rows = versions ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/referentiel/${sheet.id}`} className="text-sm text-blue-700 hover:underline">
        ← Retour à la fiche
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Historique — {sheet.title}</h1>
      <p className="text-sm text-zinc-500">
        <span className="font-mono">{sheet.code}</span> · toutes couches et tous statuts
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-zinc-400">Aucune version pour cette fiche.</p>
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
                    <p className="text-sm font-medium text-zinc-800">
                      {getLayerKindLabel(row.layer_kind)} · version {row.version}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {row.profiles?.full_name ?? "auteur inconnu"} ·{" "}
                      {new Date(row.created_at).toLocaleString("fr-FR")}
                      {row.published_at &&
                        ` · publiée le ${new Date(row.published_at).toLocaleString("fr-FR")}`}
                      {row.scheduled_at &&
                        !row.published_at &&
                        ` · programmée pour le ${new Date(row.scheduled_at).toLocaleString("fr-FR")}`}
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

                <div className="mt-2">
                  <p className="text-xs font-medium text-zinc-500">Sociétés diffusées</p>
                  {recipients.length === 0 ? (
                    <p className="text-xs text-zinc-400">Aucune (jamais publiée).</p>
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

                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-blue-700 hover:underline">
                    Voir le contenu de cette version
                  </summary>
                  <div className="mt-2 flex flex-col gap-2 border-t border-zinc-100 pt-2">
                    {CONTENT_FIELDS.map((field) => (
                      <div key={field.key}>
                        <p className="text-xs font-medium text-zinc-600">{field.label}</p>
                        <p className="whitespace-pre-wrap text-sm text-zinc-800">
                          {row.content[field.key] || <span className="text-zinc-400">(vide)</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
