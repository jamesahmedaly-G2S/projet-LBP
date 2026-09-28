"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function saveTerm(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const id = formData.get("id");
  const term = formData.get("term");
  const definition = formData.get("definition");

  if (typeof term !== "string" || !term.trim()) return "Le terme est obligatoire.";
  if (typeof definition !== "string" || !definition.trim()) return "La définition est obligatoire.";

  const data = {
    term: term.trim(),
    definition: definition.trim(),
    source: str(formData.get("source")),
    published: formData.get("published") === "on",
  };

  const supabase = await createClient();
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("dictionary_terms").update(data).eq("id", id)
      : await supabase.from("dictionary_terms").insert(data);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/dictionnaire");
  revalidatePath("/dictionnaire");
  return null;
}

export async function deleteTerm(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("dictionary_terms").delete().eq("id", id);
  revalidatePath("/administration/dictionnaire");
  revalidatePath("/dictionnaire");
}

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
