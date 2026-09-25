import type { SupabaseClient } from "@supabase/supabase-js";
import { getOfferTierLayers } from "./offer-tiers";

export interface ImpactedCompany {
  id: string;
  companyName: string;
}

export interface VersionScope {
  layerKind: string;
  ccnIdcc: string | null;
  companyId: string | null;
}

/**
 * STU-WORKFLOW-03 : calcule "qui verra quoi" pour une version donnée avant
 * publication (§12 du dossier — condition non négociable). Recalculé côté
 * serveur à chaque appel (aperçu ET publication effective, jamais une
 * liste transmise par le client) : couche rg -> toutes les sociétés ;
 * couche ccn -> sociétés ayant cette CCN ET dont le palier l'inclut
 * (`company_sheet_affectations`, STU-DATA-05, applique la même règle mais
 * seulement sur des versions déjà publiées — ici la version est encore en
 * `valid`/`scheduled`, donc requête directe plutôt que la vue) ; couches
 * ent/proc -> la société propriétaire, si son palier inclut la couche.
 */
export async function getImpactedCompanies(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  version: VersionScope,
): Promise<ImpactedCompany[]> {
  if (version.layerKind === "rg") {
    const { data } = await supabase
      .from("companies")
      .select("id, company_name")
      .order("company_name");
    return (data ?? []).map((c) => ({ id: c.id, companyName: c.company_name }));
  }

  const { data: offerTiers } = await supabase
    .from("offer_tiers")
    .select("tier_level, includes_cba, includes_agreements");

  const eligibleTierLevels = new Set(
    (offerTiers ?? [])
      .filter((tier) => getOfferTierLayers(tier)[version.layerKind as "ccn" | "ent" | "proc"])
      .map((tier) => tier.tier_level),
  );

  if (version.layerKind === "ccn") {
    if (!version.ccnIdcc) return [];
    const { data } = await supabase
      .from("company_ccns")
      .select("companies(id, company_name, offer_tier)")
      .eq("ccn_idcc", version.ccnIdcc);
    return (data ?? [])
      .map(
        (row) =>
          row.companies as unknown as {
            id: string;
            company_name: string;
            offer_tier: number;
          } | null,
      )
      .filter(
        (company): company is { id: string; company_name: string; offer_tier: number } =>
          company !== null && eligibleTierLevels.has(company.offer_tier),
      )
      .map((company) => ({ id: company.id, companyName: company.company_name }));
  }

  if (version.layerKind === "ent" || version.layerKind === "proc") {
    if (!version.companyId) return [];
    const { data: company } = await supabase
      .from("companies")
      .select("id, company_name, offer_tier")
      .eq("id", version.companyId)
      .single();
    if (!company || !eligibleTierLevels.has(company.offer_tier)) return [];
    return [{ id: company.id, companyName: company.company_name }];
  }

  return [];
}
