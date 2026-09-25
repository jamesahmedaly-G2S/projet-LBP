"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildPlaceholderContent } from "@/lib/studio/placeholder-content";

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
  const title = formData.get("title");
  const textDate = formData.get("text_date");
  const summary = formData.get("summary");
  const impact = formData.get("impact");

  if (typeof source !== "string" || !source.trim() || typeof title !== "string" || !title.trim()) {
    return "Source et titre sont obligatoires.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("legal_monitoring").insert({
    source: source.trim(),
    title: title.trim(),
    text_date: typeof textDate === "string" && textDate ? textDate : null,
    summary: typeof summary === "string" && summary.trim() ? summary.trim() : null,
    impact: typeof impact === "string" && impact.trim() ? impact.trim() : null,
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
