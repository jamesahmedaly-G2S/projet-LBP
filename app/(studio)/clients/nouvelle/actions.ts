"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * STU-CLIENT-01 : port de l'assistant en 8 étapes (`startWizard()`/`wz*()`,
 * `LBP_V6_Studio.html`, WZ_STEPS). Écart d'architecture volontaire par
 * rapport au prototype : celui-ci garde tout en mémoire (`var wz={...}`)
 * côté client et n'écrit qu'à l'étape 6. Notre Studio est entièrement
 * serveur (Server Components/Actions, jamais de gros state client) — donc
 * la société est créée dès l'étape 1 et chaque étape suivante écrit
 * directement les vraies tables (établissements, CCN, questionnaire,
 * overrides), au fil de l'eau plutôt qu'en un seul bloc final. Ça permet
 * aussi à l'étape 4 ("Calcul automatique") d'interroger la vraie vue
 * `company_sheet_affectations` au lieu de dupliquer sa logique en JS.
 */
export async function createClientCompany(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const companyName = formData.get("company_name");
  const offerTier = formData.get("offer_tier");

  if (typeof companyName !== "string" || !companyName.trim()) {
    return "La raison sociale est obligatoire.";
  }
  const tier = Number(offerTier);
  if (!Number.isInteger(tier) || tier < 1 || tier > 4) {
    return "Offre invalide.";
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({ company_name: companyName.trim(), offer_tier: tier })
    .select("id")
    .single();

  if (error || !data) {
    return `Erreur lors de la création : ${error?.message ?? "inconnue"}`;
  }

  redirect(`/clients/nouvelle/${data.id}/2`);
}

// Étape 2 — Établissements. Remplace intégralement la liste à chaque
// sauvegarde (pas d'historique attendu ici, contrairement aux réponses de
// questionnaire) : plus simple et suffisant pour une liste éditée en groupe.
export async function saveEstablishments(
  companyId: string,
  establishments: { name: string; address: string }[],
) {
  await requireAdmin();
  const supabase = await createClient();

  const clean = establishments.map((e) => ({ ...e, name: e.name.trim() })).filter((e) => e.name);
  if (clean.length === 0) {
    return "Au moins un établissement avec un nom est requis.";
  }

  const { error: deleteError } = await supabase
    .from("establishments")
    .delete()
    .eq("company_id", companyId);
  if (deleteError) {
    return `Erreur : ${deleteError.message}`;
  }

  const { error: insertError } = await supabase
    .from("establishments")
    .insert(
      clean.map((e) => ({ company_id: companyId, name: e.name, address: e.address || null })),
    );
  if (insertError) {
    return `Erreur : ${insertError.message}`;
  }

  revalidatePath(`/clients/nouvelle/${companyId}/2`);
  return null;
}

// Étape 7 — Publication : "le seul moment où les contenus entrent dans
// l'espace client" (wzNext(), step===7). Fixe published_at une bonne fois
// (jamais réécrasé si déjà publié, en cas de double-clic ou de retour en
// arrière sur cette étape).
export async function publishToClient(companyId: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("published_at")
    .eq("id", companyId)
    .single();

  if (!company?.published_at) {
    const { error } = await supabase
      .from("companies")
      .update({ published_at: new Date().toISOString() })
      .eq("id", companyId);
    if (error) {
      return `Erreur lors de la publication : ${error.message}`;
    }
  }

  revalidatePath(`/clients/nouvelle/${companyId}/7`);
  return null;
}

// Étape 8 — Accès client : port de la sémantique réelle du prototype
// ("Le client [...] a été créé et son LBP est publié") avec un vrai compte.
// `inviteUserByEmail` (service_role, seule opération admin.* possible sans
// mot de passe fabriqué) déclenche un vrai e-mail (capturé par Inbucket en
// local) et le trigger `handle_new_user()` crée le profil avec company_id
// depuis les métadonnées — jamais d'insert manuel dans `profiles`, une
// seule source de vérité pour cette création.
export async function inviteClientUser(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const companyId = formData.get("company_id");
  const email = formData.get("email");
  const fullName = formData.get("full_name");
  if (
    typeof companyId !== "string" ||
    !companyId ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof fullName !== "string" ||
    !fullName.trim()
  ) {
    return "Email et nom complet sont obligatoires.";
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    data: { company_id: companyId, full_name: fullName.trim() },
  });

  if (error) {
    return `Erreur lors de l'invitation : ${error.message}`;
  }

  revalidatePath(`/clients/nouvelle/${companyId}/8`);
  return null;
}
