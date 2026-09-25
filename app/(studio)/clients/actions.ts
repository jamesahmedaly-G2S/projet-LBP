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

// STU-AFFECT-03 : ajout/retrait manuel sur company_sheet_overrides. Un motif
// est obligatoire (§7.4 du dossier — traçabilité de la surcharge). `upsert`
// sur la contrainte unique (company_id, master_sheet_id) : re-soumettre
// change l'action (ex. passer d'un retrait à un ajout) sans dupliquer la
// ligne.
export async function setSheetOverride(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const companyId = formData.get("company_id");
  const masterSheetId = formData.get("master_sheet_id");
  const action = formData.get("action");
  const reason = formData.get("reason");

  if (
    typeof companyId !== "string" ||
    typeof masterSheetId !== "string" ||
    (action !== "add" && action !== "remove") ||
    typeof reason !== "string" ||
    !reason.trim()
  ) {
    return "Société, fiche, action et motif sont obligatoires.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("company_sheet_overrides").upsert(
    {
      company_id: companyId,
      master_sheet_id: masterSheetId,
      action,
      reason: reason.trim(),
      created_by: session.userId,
    },
    { onConflict: "company_id,master_sheet_id" },
  );

  if (error) {
    return `Erreur : ${error.message}`;
  }

  revalidatePath(`/clients/${companyId}`);
  revalidatePath("/affectations");
  return null;
}

// Revient à la règle automatique (supprime la surcharge manuelle).
export async function clearSheetOverride(
  companyId: string,
  masterSheetId: string,
): Promise<string | null> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_sheet_overrides")
    .delete()
    .eq("company_id", companyId)
    .eq("master_sheet_id", masterSheetId);

  if (error) {
    return `Erreur : ${error.message}`;
  }

  revalidatePath(`/clients/${companyId}`);
  revalidatePath("/affectations");
  return null;
}
