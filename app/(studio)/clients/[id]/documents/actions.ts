"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isDocumentCategory } from "@/lib/client/company-documents";

// LBP-CLIENT-02 : "Vos documents" (1.3.5) -- écriture admin uniquement
// (`company_documents_admin_write/update/delete`, migration
// 20261004150000), le client consulte sans pouvoir modifier
// (`renderDocDetail()`, `LBP_V9.9_Studio.html` ~L10309).

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

  const data = {
    company_id: companyId,
    category,
    name: name.trim(),
    meta: str(formData.get("meta")),
    doc_date: str(formData.get("doc_date")),
    url: str(formData.get("url")),
  };

  const supabase = await createClient();
  const { error } =
    typeof docId === "string" && docId
      ? await supabase.from("company_documents").update(data).eq("id", docId)
      : await supabase.from("company_documents").insert(data);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath(`/clients/${companyId}/documents`);
  revalidatePath("/mon-entreprise");
  return null;
}

export async function deleteDocument(id: string, companyId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("company_documents").delete().eq("id", id);
  revalidatePath(`/clients/${companyId}/documents`);
  revalidatePath("/mon-entreprise");
}
