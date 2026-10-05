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

// STU-QUEST-02/03 : chaque sauvegarde ajoute de nouvelles lignes dans
// `company_questionnaire_answers` (historique, STU-DATA-04) — jamais un
// update en place. `company_current_answers` (vue) retient toujours la
// plus récente par (société, question). `interview_id` optionnel : absent
// à la création du client (STU-CLIENT-01), renseigné pendant un entretien
// (STU-INTERVIEW-02) pour rattacher la réponse à cette session précise.
// Validation : seules les questions marquées visibles+obligatoires côté
// client (`required_codes`) sont vérifiées non vides côté serveur — ne
// fait pas confiance au seul `required` HTML.
// STU-QUEST-03 (critère d'acceptation) : une réponse reconfirmée à
// l'identique ne doit générer aucune ligne — comparée à
// `company_current_answers` avant insertion, seules les valeurs qui
// diffèrent réellement sont écrites.
export async function saveCompanyAnswers(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const companyId = formData.get("company_id");
  const interviewId = formData.get("interview_id");
  const requiredCodesRaw = formData.get("required_codes");

  if (typeof companyId !== "string" || !companyId) {
    return "Société introuvable.";
  }

  const requiredCodes =
    typeof requiredCodesRaw === "string" && requiredCodesRaw
      ? requiredCodesRaw.split(",").filter(Boolean)
      : [];

  const submitted = new Map<string, string>();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("answer__") || typeof value !== "string") continue;
    const questionCode = key.slice("answer__".length);
    if (!value.trim()) continue;
    submitted.set(questionCode, value.trim());
  }

  const missing = requiredCodes.filter((code) => !submitted.has(code));
  if (missing.length > 0) {
    return `Réponse(s) obligatoire(s) manquante(s) : ${missing.join(", ")}.`;
  }

  if (submitted.size === 0) {
    return "Aucune réponse à enregistrer.";
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("company_current_answers")
    .select("question_code, answer_value")
    .eq("company_id", companyId)
    .in("question_code", Array.from(submitted.keys()));
  const currentByCode = new Map((current ?? []).map((r) => [r.question_code, r.answer_value]));

  const rows = Array.from(submitted.entries())
    .filter(([code, value]) => currentByCode.get(code) !== value)
    .map(([code, value]) => ({
      company_id: companyId,
      interview_id: typeof interviewId === "string" && interviewId ? interviewId : null,
      question_code: code,
      answer_value: value,
    }));

  if (rows.length === 0) {
    return "Aucun changement à enregistrer.";
  }

  const { error: insertError } = await supabase.from("company_questionnaire_answers").insert(rows);

  if (insertError) {
    return `Erreur lors de l'enregistrement : ${insertError.message}`;
  }

  revalidatePath(`/clients/${companyId}`);
  revalidatePath(`/clients/${companyId}/questionnaire`);
  revalidatePath("/affectations");
  return null;
}
