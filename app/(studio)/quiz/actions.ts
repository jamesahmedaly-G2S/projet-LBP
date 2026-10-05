"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// STU-QUIZ-01/03 : CRUD des quiz (`quizzes`, colonnes additives
// `master_theme_id`/`master_sheet_id`, migration 20260928090000) —
// exactement un seul rattachement, jamais les deux (même contrainte côté
// base, revalidée ici pour un message d'erreur clair plutôt qu'une erreur
// SQL brute).
function parseAttachment(
  formData: FormData,
): { masterThemeId: string | null; masterSheetId: string | null } | string {
  const masterThemeId = formData.get("master_theme_id");
  const masterSheetId = formData.get("master_sheet_id");
  const theme = typeof masterThemeId === "string" && masterThemeId ? masterThemeId : null;
  const sheet = typeof masterSheetId === "string" && masterSheetId ? masterSheetId : null;

  if ((theme && sheet) || (!theme && !sheet)) {
    return "Choisissez soit un thème, soit une fiche — jamais les deux, jamais aucun.";
  }
  return { masterThemeId: theme, masterSheetId: sheet };
}

export async function createQuiz(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const title = formData.get("title");
  const description = formData.get("description");
  const questions = formData.get("questions");
  const published = formData.get("published") === "on";

  if (typeof title !== "string" || !title.trim()) {
    return "Le titre est obligatoire.";
  }
  if (typeof questions !== "string" || !questions.trim()) {
    return "Le contenu du quiz est obligatoire.";
  }

  const attachment = parseAttachment(formData);
  if (typeof attachment === "string") {
    return attachment;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").insert({
    title: title.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    questions,
    published,
    master_theme_id: attachment.masterThemeId,
    master_sheet_id: attachment.masterSheetId,
  });

  if (error) {
    return `Erreur lors de la création : ${error.message}`;
  }

  revalidatePath("/quiz");
  redirect("/quiz");
}

export async function updateQuiz(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const id = formData.get("id");
  const title = formData.get("title");
  const description = formData.get("description");
  const questions = formData.get("questions");
  const published = formData.get("published") === "on";

  if (typeof id !== "string" || !id) {
    return "Quiz introuvable.";
  }
  if (typeof title !== "string" || !title.trim()) {
    return "Le titre est obligatoire.";
  }
  if (typeof questions !== "string" || !questions.trim()) {
    return "Le contenu du quiz est obligatoire.";
  }

  const attachment = parseAttachment(formData);
  if (typeof attachment === "string") {
    return attachment;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({
      title: title.trim(),
      description:
        typeof description === "string" && description.trim() ? description.trim() : null,
      questions,
      published,
      master_theme_id: attachment.masterThemeId,
      master_sheet_id: attachment.masterSheetId,
    })
    .eq("id", id);

  if (error) {
    return `Erreur lors de la mise à jour : ${error.message}`;
  }

  revalidatePath("/quiz");
  revalidatePath(`/quiz/${id}`);
  return "Enregistré.";
}

export async function deleteQuiz(id: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) {
    return `Erreur lors de la suppression : ${error.message}`;
  }
  revalidatePath("/quiz");
  redirect("/quiz");
}
