"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isDocumentCategory, COMPANY_DOCUMENTS_BUCKET } from "@/lib/client/company-documents";

// LBP-CLIENT-02 : "Vos documents" (1.3.5) -- écriture admin uniquement
// (`company_documents_admin_write/update/delete`, migration
// 20261004150000), le client consulte sans pouvoir modifier
// (`renderDocDetail()`, `LBP_V9.9_Studio.html` ~L10309).
//
// Correctif (05/10/2026), suite à la réponse de Pauline : upload PDF
// réel pour les catégories autres que "cc" (conventions collectives,
// qui reste un lien Légifrance). Fichier stocké dans le bucket privé
// `company-documents` (migration 20261005090000), chemin
// `{company_id}/{category}/{uuid}.pdf` -- jamais le nom de fichier
// original dans le chemin (évite toute fuite d'information et les
// collisions), le nom réel reste dans `company_documents.name`, saisi
// par l'admin.

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo -- aligné sur file_size_limit du bucket (migration)

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function saveDocument(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const companyId = formData.get("company_id");
  const category = formData.get("category");
  const name = formData.get("name");
  const docId = formData.get("id");

  if (typeof companyId !== "string" || !companyId) return "Société manquante.";
  if (typeof category !== "string" || !isDocumentCategory(category)) return "Catégorie invalide.";
  if (typeof name !== "string" || !name.trim()) return "Le nom du document est obligatoire.";

  const supabase = await createClient();

  let filePath: string | undefined;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.type !== "application/pdf") return "Seuls les fichiers PDF sont acceptés.";
    if (file.size > MAX_FILE_SIZE) return "Le fichier ne doit pas dépasser 10 Mo.";

    filePath = `${companyId}/${category}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(COMPANY_DOCUMENTS_BUCKET)
      .upload(filePath, file, { contentType: "application/pdf" });
    if (uploadError) return `Erreur d'envoi du fichier : ${uploadError.message}`;
  }

  const data = {
    company_id: companyId,
    category,
    name: name.trim(),
    meta: str(formData.get("meta")),
    doc_date: str(formData.get("doc_date")),
    url: str(formData.get("url")),
    ...(filePath ? { file_path: filePath } : {}),
  };

  let previousFilePath: string | null = null;
  if (typeof docId === "string" && docId && filePath) {
    const { data: existing } = await supabase
      .from("company_documents")
      .select("file_path")
      .eq("id", docId)
      .single();
    previousFilePath = existing?.file_path ?? null;
  }

  const { error } =
    typeof docId === "string" && docId
      ? await supabase.from("company_documents").update(data).eq("id", docId)
      : await supabase.from("company_documents").insert(data);

  if (error) {
    // L'enregistrement a échoué après un upload réussi -- retire le
    // fichier orphelin plutôt que de laisser un objet jamais référencé.
    if (filePath) await supabase.storage.from(COMPANY_DOCUMENTS_BUCKET).remove([filePath]);
    return `Erreur : ${error.message}`;
  }

  // Remplacement d'un fichier existant par un nouveau : supprime l'ancien
  // objet une fois le nouveau confirmé en base, jamais avant (pas de
  // fenêtre où le document pointe vers un fichier déjà supprimé).
  if (previousFilePath) {
    await supabase.storage.from(COMPANY_DOCUMENTS_BUCKET).remove([previousFilePath]);
  }

  revalidatePath(`/clients/${companyId}/documents`);
  revalidatePath("/mon-entreprise");
  return null;
}

export async function deleteDocument(id: string, companyId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("company_documents")
    .select("file_path")
    .eq("id", id)
    .single();

  await supabase.from("company_documents").delete().eq("id", id);
  if (doc?.file_path) {
    await supabase.storage.from(COMPANY_DOCUMENTS_BUCKET).remove([doc.file_path]);
  }

  revalidatePath(`/clients/${companyId}/documents`);
  revalidatePath("/mon-entreprise");
}
