"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildPlaceholderContent, type SheetContent } from "@/lib/studio/placeholder-content";
import { isValidTransition } from "@/lib/studio/workflow-transitions";
import type { WorkflowStatus } from "@/lib/studio/workflow-status";

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

// STU-WORKFLOW-01 : applique une transition de statut sur une version, en
// respectant le graphe défini dans lib/studio/workflow-transitions.ts.
// Publier bascule d'abord l'éventuelle version publiée de la même
// couche/clé vers "historized" (jamais deux versions publiées en même
// temps pour une même clé — cohérent avec les index uniques partiels de
// STU-DATA-02), puis tient à jour master_sheets.status pour la couche rg
// (dénormalisation documentée dans STU-DATA-01).
export async function transitionSheetVersion(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const versionId = formData.get("version_id");
  const target = formData.get("target_status");

  if (typeof versionId !== "string" || typeof target !== "string") {
    return "Version ou statut cible manquant.";
  }
  const targetStatus = target as WorkflowStatus;

  const supabase = await createClient();

  const { data: version, error: fetchError } = await supabase
    .from("sheet_versions")
    .select("id, master_sheet_id, layer_kind, ccn_idcc, company_id, status")
    .eq("id", versionId)
    .single();

  if (fetchError || !version) {
    return "Version introuvable.";
  }

  if (!isValidTransition(version.status as WorkflowStatus, targetStatus)) {
    return `Transition invalide : "${version.status}" → "${targetStatus}" n'est pas autorisée.`;
  }

  if (targetStatus === "published") {
    let siblingQuery = supabase
      .from("sheet_versions")
      .select("id")
      .eq("master_sheet_id", version.master_sheet_id)
      .eq("layer_kind", version.layer_kind)
      .eq("status", "published")
      .neq("id", version.id);

    if (version.layer_kind === "ccn") {
      siblingQuery = siblingQuery.eq("ccn_idcc", version.ccn_idcc);
    } else if (version.layer_kind === "ent" || version.layer_kind === "proc") {
      siblingQuery = siblingQuery.eq("company_id", version.company_id);
    }

    const { data: sibling } = await siblingQuery.maybeSingle();

    if (sibling) {
      const { error: historizeError } = await supabase
        .from("sheet_versions")
        .update({ status: "historized" })
        .eq("id", sibling.id);
      if (historizeError) {
        return `Erreur lors de l'historisation de l'ancienne version : ${historizeError.message}`;
      }
    }
  }

  const { error: updateError } = await supabase
    .from("sheet_versions")
    .update({
      status: targetStatus,
      published_at: targetStatus === "published" ? new Date().toISOString() : undefined,
    })
    .eq("id", version.id);

  if (updateError) {
    return `Erreur lors de la transition : ${updateError.message}`;
  }

  if (version.layer_kind === "rg") {
    await supabase
      .from("master_sheets")
      .update({ status: targetStatus })
      .eq("id", version.master_sheet_id);
  }

  revalidatePath(`/referentiel/${version.master_sheet_id}`);
  return null;
}
