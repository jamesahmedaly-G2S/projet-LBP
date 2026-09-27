import type { SupabaseClient } from "@supabase/supabase-js";
import { getCompanyAffectations } from "./affectations";

export interface PendingSheetUpdate {
  id: string;
  masterSheetId: string;
  title: string;
  version: number;
  status: string;
  motif: string | null;
}

/**
 * STU-CLIENT-02 (§5.2, bloc "Mises à jour en attente") : port de
 * `pend=VERSIONS.filter(v=>(v.statut==='review'||v.statut==='valid')&&
 * list.indexOf(v.ficheId)>=0)` (`stClientFiche()`) — versions en cours de
 * relecture/validation sur une fiche actuellement affectée à ce client
 * (retirées manuellement exclues, comme `affectedList()` dans le prototype).
 */
export async function getPendingSheetUpdates(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  companyId: string,
): Promise<PendingSheetUpdate[]> {
  const affectations = await getCompanyAffectations(supabase, companyId);
  const activeSheetIds = affectations.filter((a) => !a.removedManually).map((a) => a.masterSheetId);
  if (activeSheetIds.length === 0) return [];

  const { data } = await supabase
    .from("sheet_versions")
    .select("id, master_sheet_id, version, status, motif, master_sheets(title)")
    .in("master_sheet_id", activeSheetIds)
    .in("status", ["review", "valid"])
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    masterSheetId: row.master_sheet_id as string,
    title: (row.master_sheets as unknown as { title: string }[] | null)?.[0]?.title ?? "",
    version: row.version as number,
    status: row.status as string,
    motif: row.motif as string | null,
  }));
}

export interface CompanySpecificContent {
  id: string;
  masterSheetId: string;
  title: string;
  version: number;
  status: string;
  updatedAt: string;
}

/**
 * STU-CLIENT-02 (§5.2, bloc "Contenus spécifiques entreprise") : versions
 * `layer_kind='ent'` de ce client (STU-DATA-02/STU-REF — la couche
 * entreprise existe déjà, réutilisée telle quelle, jamais dupliquée).
 */
export async function getCompanySpecificContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  companyId: string,
): Promise<CompanySpecificContent[]> {
  const { data } = await supabase
    .from("sheet_versions")
    .select("id, master_sheet_id, version, status, created_at, master_sheets(title)")
    .eq("layer_kind", "ent")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    masterSheetId: row.master_sheet_id as string,
    title: (row.master_sheets as unknown as { title: string }[] | null)?.[0]?.title ?? "",
    version: row.version as number,
    status: row.status as string,
    updatedAt: row.created_at as string,
  }));
}
