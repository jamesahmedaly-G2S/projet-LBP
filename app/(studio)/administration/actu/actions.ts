"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notifyAllClients } from "@/lib/studio/content-notifications";

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function saveArticle(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();
  const id = formData.get("id");
  const title = formData.get("title");
  const type = formData.get("type");

  if (typeof title !== "string" || !title.trim()) return "Le titre est obligatoire.";
  if (type !== "article" && type !== "pdf") return "Type invalide.";

  const subcategoriesRaw = str(formData.get("subcategories"));
  const data = {
    title: title.trim(),
    type,
    category: str(formData.get("category")),
    subcategories: subcategoriesRaw
      ? subcategoriesRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    author: str(formData.get("author")),
    reading_time: str(formData.get("reading_time")),
    image_url: str(formData.get("image_url")),
    pdf_url: str(formData.get("pdf_url")),
    content: str(formData.get("content")),
    published: formData.get("published") === "on",
    profil_id: session.userId,
  };

  const supabase = await createClient();

  let wasPublished = false;
  if (typeof id === "string" && id) {
    const { data: existing } = await supabase
      .from("articles")
      .select("published")
      .eq("id", id)
      .single();
    wasPublished = existing?.published ?? false;
  }

  const { error } =
    typeof id === "string" && id
      ? await supabase.from("articles").update(data).eq("id", id)
      : await supabase.from("articles").insert(data);

  if (error) return `Erreur : ${error.message}`;

  // STU-WORKFLOW-07 : même pattern que Chiffres Paie/Dictionnaire/Offres --
  // notifie seulement au passage réel brouillon -> publié, jamais sur une
  // simple correction de texte d'un article déjà publié.
  if (data.published && !wasPublished) {
    await notifyAllClients(supabase, {
      kind: "actu",
      title: `Nouvel article publié : ${data.title}`,
    });
  }

  revalidatePath("/administration/actu");
  revalidatePath("/actu");
  revalidatePath("/accueil");
  return null;
}

export async function deleteArticle(id: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/actu");
  revalidatePath("/actu");
  return null;
}
