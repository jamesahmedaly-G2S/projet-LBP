import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Port 1:1 de `WZ_STEPS` (`LBP_V6_Studio.html`) — les 8 étapes réelles de
 * l'assistant de création client (§6 du dossier, scénario A).
 */
export const WZ_STEPS = [
  "Entreprise",
  "Établissements",
  "Questionnaire & CCN",
  "Calcul",
  "Contrôle G2S",
  "Validation",
  "Publication",
  "Accès client",
] as const;

export interface WizardCompany {
  id: string;
  company_name: string;
  offer_tier: number;
  published_at: string | null;
}

/**
 * Chaque étape (2 à 8) part d'une société déjà créée à l'étape 1 — jamais
 * de state en mémoire côté client comme dans le prototype (`var wz={...}`),
 * cf. le commentaire d'en-tête de `clients/nouvelle/actions.ts`.
 */
export async function getWizardCompany(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  id: string,
): Promise<WizardCompany> {
  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name, offer_tier, published_at")
    .eq("id", id)
    .single();

  if (!company) {
    notFound();
  }

  return company;
}
