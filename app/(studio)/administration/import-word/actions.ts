"use server";

import { requireAdmin } from "@/lib/auth/session";
import { parseDocx, type ParsedDocx } from "@/lib/studio/docx-import/parse-docx";

export interface ParsePreviewResult {
  error: string | null;
  parsed: ParsedDocx | null;
}

// STU-IMPORT-01 : écran de vérification du parseur -- lecture seule pour
// l'instant, aucune écriture en base (§7.1 : "le parsing peut échouer sans
// modifier le référentiel tant que G2S n'a pas validé le mapping"). Le
// vrai écran de mapping/contrôle avec acceptation explicite est
// STU-IMPORT-03, pas encore construit.
export async function parseUploadedDocx(
  _prevState: ParsePreviewResult | null,
  formData: FormData,
): Promise<ParsePreviewResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier .docx.", parsed: null };
  }
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return { error: "Seuls les fichiers .docx sont acceptés.", parsed: null };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseDocx(buffer);
    return { error: null, parsed };
  } catch (e) {
    return {
      error: `Échec de lecture du document : ${e instanceof Error ? e.message : String(e)}`,
      parsed: null,
    };
  }
}
