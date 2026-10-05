"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// STU-OFFER-02 : "G2S conserve le contrôle" (§13) — cette action ne
// touche jamais companies.offer_tier, uniquement le statut de la demande.
// Le changement de palier reste une action séparée et explicite, faite
// ailleurs (Supabase Studio ou un futur écran dédié), jamais automatique.
export async function markOfferRequest(
  id: string,
  status: "contacted" | "closed",
): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("offer_change_requests")
    .update({ status, processed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration");
  return null;
}
