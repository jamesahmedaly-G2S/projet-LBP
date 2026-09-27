"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// STU-QUEST-01 : CRUD du questionnaire maître (master_questions +
// master_question_impacts, STU-DATA-03). `code` est l'identifiant stable
// (référencé par condition_question_code, master_question_impacts, et
// plus tard par les réponses en base) — jamais modifiable après création,
// même principe que le `code` d'une fiche maître (STU-REF-03).
export async function createQuestion(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const code = formData.get("code");
  const type = formData.get("type");
  const label = formData.get("label");
  const required = formData.get("required") === "on";
  const optionsRaw = formData.get("options");
  const conditionQuestionCode = formData.get("condition_question_code");
  const conditionValue = formData.get("condition_value");
  const displayOrder = formData.get("display_order");

  if (
    typeof code !== "string" ||
    !code.trim() ||
    typeof type !== "string" ||
    typeof label !== "string" ||
    !label.trim()
  ) {
    return "Code, type et libellé sont obligatoires.";
  }

  const options =
    typeof optionsRaw === "string" && optionsRaw.trim()
      ? optionsRaw
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;

  const supabase = await createClient();
  const { error } = await supabase.from("master_questions").insert({
    code: code.trim(),
    type,
    label: label.trim(),
    required,
    options,
    condition_question_code:
      typeof conditionQuestionCode === "string" && conditionQuestionCode
        ? conditionQuestionCode
        : null,
    condition_value:
      typeof conditionValue === "string" && conditionValue.trim() ? conditionValue.trim() : null,
    display_order: typeof displayOrder === "string" && displayOrder ? Number(displayOrder) : 0,
  });

  if (error) {
    return `Erreur lors de la création : ${error.message}`;
  }

  revalidatePath("/questionnaires");
  redirect("/questionnaires");
}

export async function updateQuestion(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const id = formData.get("id");
  const type = formData.get("type");
  const label = formData.get("label");
  const required = formData.get("required") === "on";
  const optionsRaw = formData.get("options");
  const conditionQuestionCode = formData.get("condition_question_code");
  const conditionValue = formData.get("condition_value");
  const displayOrder = formData.get("display_order");

  if (
    typeof id !== "string" ||
    typeof type !== "string" ||
    typeof label !== "string" ||
    !label.trim()
  ) {
    return "Type et libellé sont obligatoires.";
  }

  const options =
    typeof optionsRaw === "string" && optionsRaw.trim()
      ? optionsRaw
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("master_questions")
    .update({
      type,
      label: label.trim(),
      required,
      options,
      condition_question_code:
        typeof conditionQuestionCode === "string" && conditionQuestionCode
          ? conditionQuestionCode
          : null,
      condition_value:
        typeof conditionValue === "string" && conditionValue.trim() ? conditionValue.trim() : null,
      display_order: typeof displayOrder === "string" && displayOrder ? Number(displayOrder) : 0,
    })
    .eq("id", id);

  if (error) {
    return `Erreur lors de la mise à jour : ${error.message}`;
  }

  revalidatePath("/questionnaires");
  revalidatePath(`/questionnaires/${id}`);
  return "Enregistré.";
}

export async function deleteQuestion(id: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("master_questions").delete().eq("id", id);
  if (error) {
    return `Erreur lors de la suppression : ${error.message}`;
  }
  revalidatePath("/questionnaires");
  redirect("/questionnaires");
}

// STU-QUEST-01 : "quelle réponse déclenche quelle(s) fiche(s)" —
// master_question_impacts est un simple lien (question_code, answer_value)
// -> master_sheet_id, plusieurs lignes possibles pour la même réponse.
export async function addQuestionImpact(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const questionCode = formData.get("question_code");
  const answerValue = formData.get("answer_value");
  const masterSheetId = formData.get("master_sheet_id");

  if (
    typeof questionCode !== "string" ||
    typeof answerValue !== "string" ||
    !answerValue.trim() ||
    typeof masterSheetId !== "string" ||
    !masterSheetId
  ) {
    return "Valeur de réponse et fiche sont obligatoires.";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("master_question_impacts").insert({
    question_code: questionCode,
    answer_value: answerValue.trim(),
    master_sheet_id: masterSheetId,
  });

  if (error) {
    return `Erreur lors de l'ajout : ${error.message}`;
  }

  revalidatePath(`/questionnaires/${formData.get("question_id")}`);
  return null;
}

export async function removeQuestionImpact(impactId: string, questionId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("master_question_impacts").delete().eq("id", impactId);
  revalidatePath(`/questionnaires/${questionId}`);
}
