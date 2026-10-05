import type { SupabaseClient } from "@supabase/supabase-js";
import type { SheetContent } from "@/lib/studio/placeholder-content";

export interface ClientVisibleLayer {
  id: string;
  layerKind: "rg" | "ccn" | "ent" | "proc";
  ccnName: string | null;
  content: SheetContent;
  version: number;
}

/**
 * Pendant `lib/studio/client-view.ts` (`getVisibleLayersForCompany`,
 * STU-CLIENT-04) mais pour une VRAIE session cliente plutôt qu'un aperçu
 * admin. Différence essentielle, trouvée en testant en réel (`sheet_versions`
 * est admin-only par RLS — `sheet_versions_admin_all`, STU-DATA-02) :
 * `getVisibleLayersForCompany` interroge `sheet_versions` directement, ce
 * qui ne renvoie silencieusement aucune ligne pour un rôle `client` (pas
 * d'erreur, RLS filtre tout). Cette fonction interroge à la place
 * `client_sheet_content` (STU-DATA-07), la vue conçue précisément pour ça
 * — elle applique déjà le filtre CCN/offre via `current_company_id()`/
 * `current_offer_tier()` (session réelle), aucune logique de filtrage
 * dupliquée ici.
 */
export async function getSheetLayersForClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  masterSheetId: string,
): Promise<ClientVisibleLayer[]> {
  const [{ data: versions }, { data: ccnCatalog }] = await Promise.all([
    supabase
      .from("client_sheet_content")
      .select("id, layer_kind, ccn_idcc, content, version")
      .eq("master_sheet_id", masterSheetId),
    supabase.from("ccn_catalog").select("idcc, name"),
  ]);

  const ccnNames = new Map((ccnCatalog ?? []).map((c) => [c.idcc, c.name]));

  return (versions ?? []).map((v) => ({
    id: v.id as string,
    layerKind: v.layer_kind as ClientVisibleLayer["layerKind"],
    ccnName: v.ccn_idcc ? (ccnNames.get(v.ccn_idcc as string) ?? (v.ccn_idcc as string)) : null,
    content: v.content as SheetContent,
    version: v.version as number,
  }));
}
