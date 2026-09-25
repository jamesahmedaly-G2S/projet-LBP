import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMonitoringStatusLabel, getMonitoringStatusTone } from "@/lib/studio/monitoring-status";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import QualificationForms from "./QualificationForms";
import PrepareVersionButton from "./PrepareVersionButton";

interface QualificationRow {
  master_sheet_id: string;
  is_new_sheet: boolean;
  qualified_at: string;
  master_sheets: { code: string; title: string } | null;
}

export default async function VeilleEntryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("legal_monitoring")
    .select("id, source, title, text_date, summary, impact, status, created_at")
    .eq("id", id)
    .single();

  if (!entry) {
    notFound();
  }

  const { data: qualification } = await supabase
    .from("legal_monitoring_qualifications")
    .select("master_sheet_id, is_new_sheet, qualified_at, master_sheets(code, title)")
    .eq("legal_monitoring_id", id)
    .maybeSingle<QualificationRow>();

  const [{ data: families }, { data: themes }, { data: subthemes }, { data: sheets }] =
    entry.status === "new"
      ? await Promise.all([
          supabase.from("master_families").select("id, name").order("display_order"),
          supabase.from("master_themes").select("id, name, family_id").order("display_order"),
          supabase.from("master_subthemes").select("id, name, theme_id").order("display_order"),
          supabase.from("master_sheets").select("id, code, title").order("title"),
        ])
      : [{ data: null }, { data: null }, { data: null }, { data: null }];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/veille" className="text-sm text-blue-700 hover:underline">
        ← Retour à la veille
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{entry.title}</h1>
        <Badge tone={getMonitoringStatusTone(entry.status)}>
          {getMonitoringStatusLabel(entry.status)}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {entry.source}
        {entry.text_date && ` · ${new Date(entry.text_date).toLocaleDateString("fr-FR")}`}
      </p>

      <Card className="mt-6">
        {entry.summary && <p className="text-sm text-zinc-700">{entry.summary}</p>}
        {entry.impact && (
          <p className="mt-2 text-xs text-zinc-500">
            Impact pressenti : <span className="italic">{entry.impact}</span>
          </p>
        )}
      </Card>

      {qualification && (
        <Card className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-zinc-600">Qualification</h2>
          <p className="text-sm text-zinc-700">
            {qualification.is_new_sheet
              ? "Nouvelle fiche créée : "
              : "Rattachée à la fiche existante : "}
            <Link
              href={`/referentiel/${qualification.master_sheet_id}`}
              className="text-blue-700 hover:underline"
            >
              {qualification.master_sheets?.title}
            </Link>{" "}
            <span className="font-mono text-xs text-zinc-400">
              ({qualification.master_sheets?.code})
            </span>
          </p>

          {entry.status === "linked" && (
            <div className="mt-3">
              <PrepareVersionButton
                legalMonitoringId={entry.id}
                masterSheetId={qualification.master_sheet_id}
              />
            </div>
          )}
        </Card>
      )}

      {entry.status === "new" && (
        <Card className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-zinc-600">
            Qualifier cette entrée — les deux options restent toujours possibles
          </h2>
          <QualificationForms
            legalMonitoringId={entry.id}
            sheets={sheets ?? []}
            families={(families ?? []).map((f) => ({ id: f.id, name: f.name, parentId: null }))}
            themes={(themes ?? []).map((t) => ({ id: t.id, name: t.name, parentId: t.family_id }))}
            subthemes={(subthemes ?? []).map((s) => ({
              id: s.id,
              name: s.name,
              parentId: s.theme_id,
            }))}
          />
        </Card>
      )}
    </main>
  );
}
