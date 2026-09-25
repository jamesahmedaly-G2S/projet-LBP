"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// STU-VEILLE-01 : saisie manuelle d'une évolution réglementaire, sur la
// table `legal_monitoring` de James (baseline_schema_reel.sql) — réutilisée
// telle quelle, aucune migration nécessaire. Statut initial `new` (défaut
// de la colonne). Ne touche jamais `sheet_id` (référence son ancienne
// table `sheets`, hors périmètre Studio) ni aucune fiche : critère
// d'acceptation explicite du ticket, une entrée de veille seule n'a aucun
// effet de bord.
export async function createLegalMonitoring(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const source = formData.get("source");
  const title = formData.get("title");
  const textDate = formData.get("text_date");
  const summary = formData.get("summary");
  const impact = formData.get("impact");

  if (typeof source !== "string" || !source.trim() || typeof title !== "string" || !title.trim()) {
    return "Source et titre sont obligatoires.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("legal_monitoring").insert({
    source: source.trim(),
    title: title.trim(),
    text_date: typeof textDate === "string" && textDate ? textDate : null,
    summary: typeof summary === "string" && summary.trim() ? summary.trim() : null,
    impact: typeof impact === "string" && impact.trim() ? impact.trim() : null,
  });

  if (error) {
    return `Erreur lors de l'enregistrement : ${error.message}`;
  }

  revalidatePath("/veille");
  redirect("/veille");
}
