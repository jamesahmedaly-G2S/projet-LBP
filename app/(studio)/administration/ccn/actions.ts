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

  const trimmedIdcc = idcc.trim();
  if (!/^\d+$/.test(trimmedIdcc)) return "Le numéro IDCC ne doit contenir que des chiffres.";

  const supabase = await createClient();
  const { error } =
    typeof originalIdcc === "string" && originalIdcc
      ? await supabase
          .from("ccn_catalog")
          .update({ idcc: trimmedIdcc, name: name.trim() })
          .eq("idcc", originalIdcc)
      : await supabase.from("ccn_catalog").insert({ idcc: trimmedIdcc, name: name.trim() });

  if (error) {
    // Cahier des charges V9.4 §6.3/6.4 : 573, 0573, "IDCC 573" désignent la
    // même convention -- uidx_ccn_catalog_idcc_normalized (migration
    // 20260929160000) rejette le doublon, message générique Postgres
    // remplacé par un message compréhensible pour G2S.
    if (error.code === "23505") {
      return "Cette convention existe déjà sous un autre numéro IDCC (573 et 0573 sont considérés identiques).";
    }
    return `Erreur : ${error.message}`;
  }
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
