"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildPlaceholderContent } from "@/lib/studio/placeholder-content";
import {
  runAllConnectorsAndNotify,
  type ConnectorResult,
} from "@/lib/studio/monitoring-connectors";
import type { NotificationResult } from "@/lib/studio/monitoring-notifications";
import { analyzeMonitoringEntry, type AiAnalysisResult } from "@/lib/studio/monitoring-ai-analysis";

// STU-VEILLE-01 : saisie manuelle d'une évolution réglementaire, sur la
// table `legal_monitoring` de James (baseline_schema_reel.sql) — réutilisée
// telle quelle, aucune migration nécessaire. Statut initial `new` (défaut
// de la colonne). Ne touche jamais `sheet_id` (référence son ancienne
// table `sheets`, hors périmètre Studio) ni aucune fiche : critère
// d'acceptation explicite du ticket, une entrée de veille seule n'a aucun
// effet de bord.
export async function createLegalMonitoring(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const source = formData.get("source");
  const textType = formData.get("text_type");
  const title = formData.get("title");
  const textDate = formData.get("text_date");
  const publicationDate = formData.get("publication_date");
  const effectiveDate = formData.get("effective_date");
  const link = formData.get("link");
  const summary = formData.get("summary");
  const impact = formData.get("impact");

  if (typeof source !== "string" || !source.trim() || typeof title !== "string" || !title.trim()) {
    return "Source et titre sont obligatoires.";
  }

  const str = (v: FormDataEntryValue | null) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  const supabase = await createClient();
  const { error } = await supabase.from("legal_monitoring").insert({
    source: source.trim(),
    text_type: str(textType),
    title: title.trim(),
    text_date: str(textDate),
    publication_date: str(publicationDate),
    effective_date: str(effectiveDate),
    link: str(link),
    summary: str(summary),
    impact: str(impact),
  });

  if (error) {
    return `Erreur lors de l'enregistrement : ${error.message}`;
  }

  revalidatePath("/veille");
  redirect("/veille");
}

// STU-VEILLE-02 : les deux chemins de qualification (§9, CR 17/09) —
// rattacher à une fiche existante ou en créer une nouvelle — sont deux
// actions distinctes, jamais une seule suggestion automatique. Toutes deux
// écrivent la même ligne dans `legal_monitoring_qualifications` (table
// additive, pas celle de James — voir la migration) et font passer le
// statut à `linked` ("qualifiée" dans le vocabulaire du dossier).
export async function qualifyWithExistingSheet(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const legalMonitoringId = formData.get("legal_monitoring_id");
  const masterSheetId = formData.get("master_sheet_id");

  if (
    typeof legalMonitoringId !== "string" ||
    typeof masterSheetId !== "string" ||
    !masterSheetId
  ) {
    return "Choisissez une fiche existante.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("legal_monitoring_qualifications").insert({
    legal_monitoring_id: legalMonitoringId,
    master_sheet_id: masterSheetId,
    is_new_sheet: false,
    qualified_by: session.userId,
  });
  if (error) {
    return `Erreur lors de la qualification : ${error.message}`;
  }

  await supabase.from("legal_monitoring").update({ status: "linked" }).eq("id", legalMonitoringId);

  revalidatePath("/veille");
  redirect(`/veille/${legalMonitoringId}`);
}

export async function qualifyWithNewSheet(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const legalMonitoringId = formData.get("legal_monitoring_id");
  const familyId = formData.get("family_id");
  const themeId = formData.get("theme_id");
  const subthemeId = formData.get("subtheme_id");
  const title = formData.get("title");

  if (
    typeof legalMonitoringId !== "string" ||
    typeof familyId !== "string" ||
    typeof themeId !== "string" ||
    typeof title !== "string" ||
    !title.trim()
  ) {
    return "Famille, thème et titre sont obligatoires pour créer la nouvelle fiche.";
  }

  const supabase = await createClient();

  const { count } = await supabase
    .from("master_sheets")
    .select("id", { count: "exact", head: true })
    .eq("theme_id", themeId);
  const { data: theme } = await supabase
    .from("master_themes")
    .select("code")
    .eq("id", themeId)
    .single();
  const sequence = String((count ?? 0) + 1).padStart(3, "0");
  const code = `${theme?.code ?? "THEME"}-${sequence}`;

  const { data: sheet, error: sheetError } = await supabase
    .from("master_sheets")
    .insert({
      code,
      family_id: familyId,
      theme_id: themeId,
      subtheme_id: typeof subthemeId === "string" && subthemeId ? subthemeId : null,
      title: title.trim(),
      status: "draft",
    })
    .select("id")
    .single();

  if (sheetError || !sheet) {
    return `Erreur lors de la création de la fiche : ${sheetError?.message ?? "inconnue"}`;
  }

  const { error: versionError } = await supabase.from("sheet_versions").insert({
    master_sheet_id: sheet.id,
    layer_kind: "rg",
    version: 1,
    status: "draft",
    content: buildPlaceholderContent(title.trim()),
    author_id: session.userId,
  });
  if (versionError) {
    return `Fiche créée mais erreur sur la version initiale : ${versionError.message}`;
  }

  const { error: qualifError } = await supabase.from("legal_monitoring_qualifications").insert({
    legal_monitoring_id: legalMonitoringId,
    master_sheet_id: sheet.id,
    is_new_sheet: true,
    qualified_by: session.userId,
  });
  if (qualifError) {
    return `Fiche créée mais erreur lors de la qualification : ${qualifError.message}`;
  }

  await supabase.from("legal_monitoring").update({ status: "linked" }).eq("id", legalMonitoringId);

  revalidatePath("/veille");
  redirect(`/veille/${legalMonitoringId}`);
}

// STU-VEILLE-04 : déclenchement manuel des connecteurs depuis le Studio —
// même logique que la route cron (AUTOMATION-01/#85), mais via une action
// authentifiée (requireAdmin) plutôt que le secret partagé, pour un test
// réel sans attendre l'ordonnanceur externe. Aucune entrée simulée : les
// connecteurs non configurés remontent leur statut tel quel.
export async function runConnectorsNow(): Promise<{
  results: ConnectorResult[];
  notification: NotificationResult;
}> {
  await requireAdmin();
  const supabase = await createClient();
  const { results, notification } = await runAllConnectorsAndNotify(supabase);
  revalidatePath("/veille");
  return { results, notification };
}

// STU-VEILLE-04 (AUTOMATION-03, #87) : déclenchement manuel de l'analyse
// IA sur une entrée — appel réel gardé derrière ANTHROPIC_API_KEY (voir
// lib/studio/monitoring-ai-analysis.ts).
export async function analyzeEntryWithAi(legalMonitoringId: string): Promise<AiAnalysisResult> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("legal_monitoring")
    .select("source, title, summary, link, text_date")
    .eq("id", legalMonitoringId)
    .single();

  const rawText = [entry?.title, entry?.summary].filter(Boolean).join("\n\n");
  return analyzeMonitoringEntry({
    source: entry?.source ?? "inconnue",
    link: entry?.link ?? null,
    publishedAt: entry?.text_date ?? null,
    rawText,
  });
}
