"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";

// STU-INTERVIEW-02 : "ouvrir le questionnaire actuel prérempli... identifier
// les impacts" (§11) — reprend l'entretien déjà ouvert et non terminé pour
// cette société (`to_plan`/`planned`/`late`) plutôt que d'en recréer un
// nouveau à chaque clic sur "Lancer l'entretien" ; `before_sheet_ids`
// (migration 20260928080000) n'est fixé qu'à la toute première ouverture —
// un instantané pris une seule fois, jamais réécrasé si on revient sur un
// entretien déjà commencé.
export async function startInterview(companyId: string): Promise<never> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("company_interviews")
    .select("id")
    .eq("company_id", companyId)
    .neq("status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect(`/clients/${companyId}/entretien/${existing.id}`);
  }

  const affectations = await getCompanyAffectations(supabase, companyId);
  const beforeSheetIds = affectations.filter((a) => !a.removedManually).map((a) => a.masterSheetId);

  const { data: created, error } = await supabase
    .from("company_interviews")
    .insert({
      company_id: companyId,
      status: "planned",
      planned_at: new Date().toISOString().slice(0, 10),
      before_sheet_ids: beforeSheetIds,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`Erreur lors de la création de l'entretien : ${error?.message ?? "inconnue"}`);
  }

  redirect(`/clients/${companyId}/entretien/${created.id}`);
}

// "soumettre au contrôle G2S et publier" (§11) : marque l'entretien
// réellement terminé — `completed_at` alimente `summarizeEntretiens()`
// (STU-CLIENT-02), qui recalcule automatiquement la prochaine échéance
// (`entretienPeriodeMois`), jamais une date stockée en dur ici.
export async function completeInterview(
  companyId: string,
  interviewId: string,
): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("company_interviews")
    .update({ status: "done", completed_at: new Date().toISOString().slice(0, 10) })
    .eq("id", interviewId)
    .eq("company_id", companyId);

  if (error) {
    return `Erreur : ${error.message}`;
  }

  revalidatePath(`/clients/${companyId}`);
  revalidatePath("/entretiens");
  redirect(`/clients/${companyId}`);
}
