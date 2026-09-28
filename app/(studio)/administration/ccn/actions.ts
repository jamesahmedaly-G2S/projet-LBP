"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function saveCcn(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const originalIdcc = formData.get("original_idcc");
  const idcc = formData.get("idcc");
  const name = formData.get("name");

  if (typeof idcc !== "string" || !idcc.trim()) return "Le numéro IDCC est obligatoire.";
  if (typeof name !== "string" || !name.trim()) return "Le nom de la convention est obligatoire.";

  const supabase = await createClient();
  const { error } =
    typeof originalIdcc === "string" && originalIdcc
      ? await supabase
          .from("ccn_catalog")
          .update({ idcc: idcc.trim(), name: name.trim() })
          .eq("idcc", originalIdcc)
      : await supabase.from("ccn_catalog").insert({ idcc: idcc.trim(), name: name.trim() });

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/ccn");
  return null;
}

export async function deleteCcn(idcc: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("ccn_catalog").delete().eq("idcc", idcc);
  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/ccn");
  return null;
}
