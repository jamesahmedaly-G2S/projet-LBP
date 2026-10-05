import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMonitoringStatusLabel, getMonitoringStatusTone } from "@/lib/studio/monitoring-status";
import { suggestTheme } from "@/lib/studio/veille-suggestion";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import QualificationForms from "./QualificationForms";
import PrepareVersionButton from "./PrepareVersionButton";
import AnalyzeButton from "./AnalyzeButton";
import AddToCalendarButton from "./AddToCalendarButton";
import SuggestionBanner from "./SuggestionBanner";

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
    .select(
      "id, source, text_type, title, text_date, publication_date, effective_date, link, summary, impact, status, created_at",
    )
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
          supabase
            .from("master_sheets")
            .select("id, code, title, theme_id, subtheme_id")
            .order("title"),
        ])
      : [{ data: null }, { data: null }, { data: null }, { data: null }];

  const themeOptions = (themes ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    parentId: t.family_id,
  }));
  const subthemeOptions = (subthemes ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    parentId: s.theme_id,
  }));
  const suggestion =
    entry.status === "new"
      ? suggestTheme(`${entry.title} ${entry.summary ?? ""}`, themeOptions, subthemeOptions)
      : null;
  const matchingSheets = suggestion
    ? (sheets ?? []).filter(
        (s) => s.subtheme_id === suggestion.subthemeId || s.theme_id === suggestion.themeId,
      )
    : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/veille" className="text-sm text-studio-blue hover:underline">
        ← Retour à la veille
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-studio-navy">{entry.title}</h1>
        <Badge tone={getMonitoringStatusTone(entry.status)}>
          {getMonitoringStatusLabel(entry.status)}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-studio-muted">
        {entry.source}
        {entry.text_type && ` · ${entry.text_type}`}
      </p>
      <p className="mt-0.5 text-xs text-studio-muted">
        {entry.text_date &&
          `Date du texte : ${new Date(entry.text_date).toLocaleDateString("fr-FR")}`}
        {entry.publication_date &&
          ` · Publication : ${new Date(entry.publication_date).toLocaleDateString("fr-FR")}`}
        {entry.effective_date &&
          ` · Entrée en vigueur : ${new Date(entry.effective_date).toLocaleDateString("fr-FR")}`}
      </p>

      <Card className="mt-6">
        {entry.summary && <p className="text-sm text-studio-navy">{entry.summary}</p>}
        {entry.impact && (
          <p className="mt-2 text-xs text-studio-muted">
            Impact pressenti : <span className="italic">{entry.impact}</span>
          </p>
        )}
        {entry.link && (
          <a
            href={entry.link}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-xs text-studio-blue hover:underline"
          >
            Voir le texte officiel ↗
          </a>
        )}
        <div className="mt-3 flex flex-wrap gap-4">
          <AnalyzeButton legalMonitoringId={entry.id} />
          <AddToCalendarButton legalMonitoringId={entry.id} />
        </div>
      </Card>

      {qualification && (
        <Card className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-studio-muted">Qualification</h2>
          <p className="text-sm text-studio-navy">
            {qualification.is_new_sheet
              ? "Nouvelle fiche créée : "
              : "Rattachée à la fiche existante : "}
            <Link
              href={`/referentiel/${qualification.master_sheet_id}`}
              className="text-studio-blue hover:underline"
            >
              {qualification.master_sheets?.title}
            </Link>{" "}
            <span className="font-mono text-xs text-studio-muted">
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
          <h2 className="mb-3 text-sm font-medium text-studio-muted">
            Qualifier cette entrée — les deux options restent toujours possibles
          </h2>
          {suggestion && (
            <SuggestionBanner suggestion={suggestion} matchingSheets={matchingSheets} />
          )}
          <QualificationForms
            legalMonitoringId={entry.id}
            sheets={sheets ?? []}
            families={(families ?? []).map((f) => ({ id: f.id, name: f.name, parentId: null }))}
            themes={themeOptions}
            subthemes={subthemeOptions}
            suggested={
              suggestion
                ? {
                    familyId: suggestion.familyId,
                    themeId: suggestion.themeId,
                    subthemeId: suggestion.subthemeId,
                  }
                : undefined
            }
          />
        </Card>
      )}
    </main>
  );
}
