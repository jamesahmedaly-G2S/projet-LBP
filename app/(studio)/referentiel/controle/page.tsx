import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getLayerKindLabel } from "@/lib/studio/layer-kind";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import ControlActions from "./ControlActions";

interface ReviewRow {
  id: string;
  version: number;
  layer_kind: string;
  motif: string | null;
  created_at: string;
  master_sheets: { id: string; code: string; title: string } | null;
  profiles: { full_name: string } | null;
}

// STU-WORKFLOW-02 : file d'attente de contrôle G2S — toutes les versions en
// statut "review", tous types de fiches/couches confondus, avec action
// valider/renvoyer en brouillon et motif obligatoire (§6, §10 du dossier).
// Alimente le compteur "Validations en attente" du tableau de bord
// (STU-DASH-01) via une requête directe sur ce même statut, sans données
// dupliquées.
export default async function ControlePage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: versions } = await supabase
    .from("sheet_versions")
    .select(
      "id, version, layer_kind, motif, created_at, master_sheets(id, code, title), profiles(full_name)",
    )
    .eq("status", "review")
    .order("created_at")
    .returns<ReviewRow[]>();

  const rows = versions ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">Contrôle G2S</h1>
        <Badge tone={rows.length > 0 ? "amber" : "neutral"}>{rows.length} en attente</Badge>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Versions passées en « À vérifier », toutes fiches et couches confondues.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-zinc-400">Rien à contrôler pour l&apos;instant.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/referentiel/${row.master_sheets?.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {row.master_sheets?.title ?? "(fiche introuvable)"}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    <span className="font-mono">{row.master_sheets?.code}</span> ·{" "}
                    {getLayerKindLabel(row.layer_kind)} · version {row.version} ·{" "}
                    {row.profiles?.full_name ?? "auteur inconnu"}
                  </p>
                  {row.motif && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Motif précédent : <span className="italic">{row.motif}</span>
                    </p>
                  )}
                </div>
                <Badge tone="amber">À vérifier</Badge>
              </div>

              <div className="mt-3">
                <ControlActions versionId={row.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
