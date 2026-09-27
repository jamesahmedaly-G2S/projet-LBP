import type { SupabaseClient } from "@supabase/supabase-js";
import { getOfferTierLayers } from "./offer-tiers";
import type { SheetContent } from "./placeholder-content";

export interface VisibleLayer {
  id: string;
  layerKind: "rg" | "ccn" | "ent" | "proc";
  ccnName: string | null;
  content: SheetContent;
  version: number;
}

/**
 * STU-CLIENT-04 : "afficher le LBP exactement tel que le client le voit".
 * `client_sheet_content` (STU-DATA-07) applique cette même règle via RLS,
 * mais pour la session du CLIENT connecté (`current_company_id()`) — un
 * admin qui prévisualise "en tant que" une société précise ne peut pas
 * passer par cette vue (`is_admin()` y court-circuite tout, il verrait
 * l'intégralité, pas ce que ce client verrait réellement). Reproduit donc
 * la même logique ici, paramétrée par `companyId`, en réutilisant
 * `getOfferTierLayers()` (STU-DATA-06) — jamais une nouvelle règle
 * métier, la même donnée qui pilote déjà la vraie vue RLS.
 */
export async function getVisibleLayersForCompany(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  companyId: string,
  masterSheetId: string,
): Promise<VisibleLayer[]> {
  const [{ data: company }, { data: companyCcns }, { data: versions }] = await Promise.all([
    supabase.from("companies").select("offer_tier").eq("id", companyId).single(),
    supabase.from("company_ccns").select("ccn_idcc, ccn_catalog(name)").eq("company_id", companyId),
    supabase
      .from("sheet_versions")
      .select("id, layer_kind, ccn_idcc, company_id, content, version")
      .eq("master_sheet_id", masterSheetId)
      .eq("status", "published"),
  ]);

  if (!company) return [];

  const { data: offerTier } = await supabase
    .from("offer_tiers")
    .select("tier_level, includes_cba, includes_agreements")
    .eq("tier_level", company.offer_tier)
    .single();
  if (!offerTier) return [];

  const layers = getOfferTierLayers(offerTier);
  const ccnIds = new Set((companyCcns ?? []).map((c) => c.ccn_idcc));
  const ccnNames = new Map(
    (companyCcns ?? []).map((c) => [
      c.ccn_idcc,
      (c.ccn_catalog as unknown as { name: string }[] | null)?.[0]?.name ?? c.ccn_idcc,
    ]),
  );

  return (versions ?? [])
    .filter((v) => {
      if (v.layer_kind === "rg") return layers.rg;
      if (v.layer_kind === "ccn") return layers.ccn && ccnIds.has(v.ccn_idcc as string);
      if (v.layer_kind === "ent") return layers.ent && v.company_id === companyId;
      if (v.layer_kind === "proc") return layers.proc && v.company_id === companyId;
      return false;
    })
    .map((v) => ({
      id: v.id as string,
      layerKind: v.layer_kind as VisibleLayer["layerKind"],
      ccnName: v.ccn_idcc ? (ccnNames.get(v.ccn_idcc as string) ?? (v.ccn_idcc as string)) : null,
      content: v.content as SheetContent,
      version: v.version as number,
    }));
}
