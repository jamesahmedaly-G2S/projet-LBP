"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildPlaceholderContent, type SheetContent } from "@/lib/studio/placeholder-content";

// STU-REF-02 : création d'une fiche maître (métadonnées + première version
// "rg" en brouillon, contenu factice) et édition de ce contenu.

export async function createMasterSheet(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const familyId = formData.get("family_id");
  const themeId = formData.get("theme_id");
  const subthemeId = formData.get("subtheme_id");
  const title = formData.get("title");
  const tagsRaw = formData.get("tags");

  if (
    typeof familyId !== "string" ||
    typeof themeId !== "string" ||
    typeof title !== "string" ||
    !title.trim()
  ) {
    return "Famille, thème et titre sont obligatoires.";
  }

  const tags =
    typeof tagsRaw === "string" && tagsRaw.trim()
      ? tagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  const supabase = await createClient();

  // Identifiant stable derive du theme (code du theme + rang) - simplification
  // volontaire pour un outil interne a faible concurrence : en cas de
  // collision rarissime, la contrainte unique sur `code` fait echouer
  // l'insertion plutot que de corrompre des donnees.
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
      tags,
      status: "draft",
    })
    .select("id")
    .single();

  if (sheetError || !sheet) {
    return `Erreur lors de la création : ${sheetError?.message ?? "inconnue"}`;
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

  redirect(`/referentiel/${sheet.id}`);
}

export async function updateSheetContent(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const versionId = formData.get("version_id");
  if (typeof versionId !== "string") {
    return "Version introuvable.";
  }

  const content: SheetContent = {
    essentiel: String(formData.get("essentiel") ?? ""),
    comprendre: String(formData.get("comprendre") ?? ""),
    maitriser: String(formData.get("maitriser") ?? ""),
    application: String(formData.get("application") ?? ""),
    vigilance: String(formData.get("vigilance") ?? ""),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("sheet_versions").update({ content }).eq("id", versionId);

  if (error) {
    return `Erreur lors de l'enregistrement : ${error.message}`;
  }

  return "Enregistré.";
}

// STU-REF-03 : renommer une fiche ne touche jamais son `code` (identifiant
// stable) - master_question_impacts et company_sheet_overrides référencent
// l'id/le code, jamais le titre, donc aucune affectation n'est cassée par
// un renommage.
export async function renameMasterSheet(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const sheetId = formData.get("sheet_id");
  const title = formData.get("title");

  if (typeof sheetId !== "string" || typeof title !== "string" || !title.trim()) {
    return "Titre requis.";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("master_sheets")
    .update({ title: title.trim() })
    .eq("id", sheetId);

  if (error) {
    return `Erreur lors du renommage : ${error.message}`;
  }

  return "Titre mis à jour.";
}
