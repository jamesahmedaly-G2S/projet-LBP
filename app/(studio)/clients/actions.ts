"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// STU-CCN-02 : écriture sur company_ccns réservée à G2S (requireAdmin,
// cohérent avec la policy company_ccns_write_admin côté base).
export async function updateCompanyCcns(
  companyId: string,
  ccnIdccList: string[],
): Promise<string | null> {
  await requireAdmin();

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("company_ccns")
    .select("ccn_idcc")
    .eq("company_id", companyId);

  const currentSet = new Set((current ?? []).map((row) => row.ccn_idcc));
  const nextSet = new Set(ccnIdccList);

  const toAdd = ccnIdccList.filter((idcc) => !currentSet.has(idcc));
  const toRemove = [...currentSet].filter((idcc) => !nextSet.has(idcc));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("company_ccns")
      .delete()
      .eq("company_id", companyId)
      .in("ccn_idcc", toRemove);
    if (error) return `Erreur lors du retrait : ${error.message}`;
  }

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("company_ccns")
      .insert(toAdd.map((idcc) => ({ company_id: companyId, ccn_idcc: idcc })));
    if (error) return `Erreur lors de l'ajout : ${error.message}`;
  }

  revalidatePath(`/clients/${companyId}`);
  return null;
}
