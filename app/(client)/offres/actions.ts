"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// LBP-CLIENT-07 : "Il peut demander une évolution d'offre ; G2S conserve
// le contrôle" (§13, STU-OFFER-02) — cette action n'écrit jamais
// companies.offer_tier, uniquement une ligne offer_change_requests.
// Le traitement (contacté/clôturé) se fait déjà côté G2S (/administration,
// STU-OFFER-02), jamais ici.
export async function requestOfferChange(targetTier: number): Promise<string | null> {
  const session = await requireClient();
  const companyId = session.profile.company_id;
  const currentTier = session.profile.offer_tier;

  if (!companyId || currentTier === null) {
    return "Aucune société rattachée à ce compte.";
  }
  if (targetTier === currentTier) {
    return "Vous êtes déjà sur ce palier.";
  }

  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("offer_change_requests")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) {
    return "Une demande est déjà en attente de traitement.";
  }

  const { error } = await supabase.from("offer_change_requests").insert({
    company_id: companyId,
    profile_id: session.userId,
    current_tier: currentTier,
    requested_tier: targetTier,
  });

  if (error) return `Erreur lors de l'envoi de la demande : ${error.message}`;
  revalidatePath("/offres");
  return null;
}
