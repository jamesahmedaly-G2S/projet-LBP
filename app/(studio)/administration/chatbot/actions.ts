"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// LBP-CLIENT-13 : CRUD admin de l'arbre de décision du chatbot
// (migration 20261006110000) -- "modulaire et simple à intégrer... en
// ajoutant des questions côté LBP Studio dans la section administration".

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export async function saveQuestion(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const id = formData.get("id");
  const prompt = formData.get("prompt");
  const isRoot = formData.get("is_root") === "on";

  if (typeof prompt !== "string" || !prompt.trim()) return "La question est obligatoire.";

  const supabase = await createClient();

  // Au plus une racine : si celle-ci devient la racine, les autres ne le
  // sont plus (contrainte d'unicité partielle en base, migration
  // 20261006110000 -- cette mise à jour évite de la violer).
  if (isRoot) {
    await supabase.from("chatbot_questions").update({ is_root: false }).eq("is_root", true);
  }

  const data = { prompt: prompt.trim(), is_root: isRoot };
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("chatbot_questions").update(data).eq("id", id)
      : await supabase.from("chatbot_questions").insert(data);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/chatbot");
  return null;
}

export async function deleteQuestion(id: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("chatbot_questions").delete().eq("id", id);
  if (error) {
    // La contrainte CHECK d'option (exactement un type de résultat) peut
    // refuser la suppression si une autre option pointe encore vers cette
    // question via next_question_id (ON DELETE SET NULL la viderait sans
    // laisser d'autre résultat configuré) -- message clair plutôt que
    // l'erreur SQL brute.
    if (error.message.includes("chatbot_options_check")) {
      return "Impossible de supprimer : une option d'une autre question pointe encore vers celle-ci. Modifiez ou supprimez cette option d'abord.";
    }
    return `Erreur : ${error.message}`;
  }
  revalidatePath("/administration/chatbot");
  return null;
}

export async function saveOption(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const id = formData.get("id");
  const questionId = formData.get("question_id");
  const label = formData.get("label");
  const outcome = formData.get("outcome");

  if (typeof questionId !== "string" || !questionId) return "Question manquante.";
  if (typeof label !== "string" || !label.trim()) return "Le libellé est obligatoire.";

  const sortOrderRaw = Number(formData.get("sort_order"));
  const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;

  const data: {
    question_id: string;
    label: string;
    sort_order: number;
    next_question_id: string | null;
    solution_text: string | null;
    is_escalation: boolean;
  } = {
    question_id: questionId,
    label: label.trim(),
    sort_order: sortOrder,
    next_question_id: null,
    solution_text: null,
    is_escalation: false,
  };

  if (outcome === "next_question") {
    const nextId = str(formData.get("next_question_id"));
    if (!nextId) return "Choisissez la question suivante.";
    data.next_question_id = nextId;
  } else if (outcome === "escalation") {
    data.is_escalation = true;
  } else {
    const solution = str(formData.get("solution_text"));
    if (!solution) return "Indiquez le texte de la solution.";
    data.solution_text = solution;
  }

  const supabase = await createClient();
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("chatbot_options").update(data).eq("id", id)
      : await supabase.from("chatbot_options").insert(data);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/chatbot");
  return null;
}

export async function deleteOption(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("chatbot_options").delete().eq("id", id);
  revalidatePath("/administration/chatbot");
}
