"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseDocx, type ParsedDocx } from "@/lib/studio/docx-import/parse-docx";
import {
  matchCcnMentions,
  type CcnCatalogEntry,
  type CcnMatch,
} from "@/lib/studio/docx-import/match-ccn";
import { buildPlaceholderContent, type SheetContent } from "@/lib/studio/placeholder-content";

export interface ParsePreviewResult {
  error: string | null;
  parsed: ParsedDocx | null;
  ccnMatches: CcnMatch[] | null;
  ccnCatalog: CcnCatalogEntry[] | null;
}

// STU-IMPORT-01/02 : lecture + rapprochement CCN, aucune écriture en base
// (§7.1 : "le parsing peut échouer sans modifier le référentiel tant que
// G2S n'a pas validé le mapping"). L'écriture réelle n'a lieu qu'après
// validation explicite -- voir validateAndCreateSheet() plus bas
// (STU-IMPORT-03).
export async function parseUploadedDocx(
  _prevState: ParsePreviewResult | null,
  formData: FormData,
): Promise<ParsePreviewResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "Sélectionnez un fichier .docx.",
      parsed: null,
      ccnMatches: null,
      ccnCatalog: null,
    };
  }
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return {
      error: "Seuls les fichiers .docx sont acceptés.",
      parsed: null,
      ccnMatches: null,
      ccnCatalog: null,
    };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseDocx(buffer);

    const supabase = await createClient();
    const { data: catalog } = await supabase.from("ccn_catalog").select("idcc, name");
    const ccnCatalog = catalog ?? [];
    const ccnMatches = matchCcnMentions(parsed.ccnMentions, ccnCatalog);

    return { error: null, parsed, ccnMatches, ccnCatalog };
  } catch (e) {
    return {
      error: `Échec de lecture du document : ${e instanceof Error ? e.message : String(e)}`,
      parsed: null,
      ccnMatches: null,
      ccnCatalog: null,
    };
  }
}

export interface ValidateSheetInput {
  numeroFiche: string;
  titre: string;
  familyId: string;
  themeId: string;
  subthemeId: string | null;
  content: SheetContent;
  ccnLayerIdccs: string[];
}

export interface ValidateSheetResult {
  error: string | null;
  sheetId: string | null;
}

// STU-IMPORT-03 : seul point d'écriture réelle de tout l'epic STU-IMPORT --
// rien n'est créé avant cet appel explicite (§7.1/§13.1). Le numéro de
// fiche (ex. "01.01") devient master_sheets.code, la vraie clé métier de
// rapprochement du cahier (§7.5) -- distinct du générateur "THEME-001" de
// createMasterSheet() (STU-REF-02), qui ne s'applique qu'aux fiches créées
// à la main sans numéro déjà connu. Une fiche avec ce code existant est
// bloquée plutôt qu'écrasée ou dupliquée -- la vraie mise à jour par
// numéro de fiche est STU-IMPORT-04, pas encore construit.
export async function validateAndCreateSheet(
  input: ValidateSheetInput,
): Promise<ValidateSheetResult> {
  const session = await requireAdmin();

  if (!input.numeroFiche.trim()) return { error: "Numéro de fiche manquant.", sheetId: null };
  if (!input.titre.trim()) return { error: "Titre manquant.", sheetId: null };
  if (!input.familyId || !input.themeId) {
    return { error: "Famille et thème sont obligatoires.", sheetId: null };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("master_sheets")
    .select("id")
    .eq("code", input.numeroFiche)
    .maybeSingle();
  if (existing) {
    return {
      error: `La fiche ${input.numeroFiche} existe déjà -- la mise à jour d'une fiche existante par import (STU-IMPORT-04) n'est pas encore construite.`,
      sheetId: null,
    };
  }

  const { data: sheet, error: sheetError } = await supabase
    .from("master_sheets")
    .insert({
      code: input.numeroFiche,
      family_id: input.familyId,
      theme_id: input.themeId,
      subtheme_id: input.subthemeId,
      title: input.titre,
      status: "draft",
    })
    .select("id")
    .single();

  if (sheetError || !sheet) {
    return {
      error: `Erreur lors de la création de la fiche : ${sheetError?.message ?? "inconnue"}`,
      sheetId: null,
    };
  }

  const { error: versionError } = await supabase.from("sheet_versions").insert({
    master_sheet_id: sheet.id,
    layer_kind: "rg",
    version: 1,
    status: "draft",
    content: input.content,
    author_id: session.userId,
  });
  if (versionError) {
    return {
      error: `Fiche créée mais erreur sur la version initiale : ${versionError.message}`,
      sheetId: sheet.id,
    };
  }

  // Couches CCN : même forme que createCcnLayer() (referentiel/actions.ts,
  // STU-CCN-03) -- contenu factice pour l'instant, l'extraction du texte
  // réellement spécifique à chaque CCN depuis le Word n'est pas modélisée
  // (le document ne distingue pas encore "ce paragraphe est propre à telle
  // CCN" au-delà de la simple mention IDCC), signalé dans le ticket.
  for (const idcc of input.ccnLayerIdccs) {
    await supabase.from("sheet_versions").insert({
      master_sheet_id: sheet.id,
      layer_kind: "ccn",
      ccn_idcc: idcc,
      version: 1,
      status: "draft",
      content: buildPlaceholderContent(input.titre),
      author_id: session.userId,
    });
  }

  revalidatePath("/referentiel");
  return { error: null, sheetId: sheet.id };
}
