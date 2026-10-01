"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// LBP-CLIENT-01 (finitions fidélité, 01/10/2026) : "Vos rappels de la
// semaine" -- manquait entièrement, signalé par l'utilisateur après
// vérification directe de la V9.9. `tasks` (schéma réel de James,
// baseline_schema_reel.sql §9.x, task_status 'todo'/'doing'/'done', RLS
// déjà réelle `tasks_own: is_admin() or profile_id = auth.uid()`) existe
// depuis le début, jamais consommée par aucun écran avant ce ticket --
// même pattern que team_members/notifications/ccn_catalog avant elle.
// Porté 1:1 depuis TASKS/renderReminders()/saveTask()/setTaskStatus()
// (LBP_V9.9_Studio.html, lignes ~4380-4399) : title/due_date/note/status,
// strictement personnel par profil (jamais partagé, contrairement aux
// calendar_events scope='company').
export async function addTask(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireClient();
  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) return "Indiquez un intitulé.";

  const dueDate = formData.get("due_date");
  const note = formData.get("note");
  const status = formData.get("status");

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    profile_id: session.userId,
    title: title.trim(),
    due_date: typeof dueDate === "string" && dueDate ? dueDate : null,
    note: typeof note === "string" && note.trim() ? note.trim() : null,
    status: status === "doing" || status === "done" ? status : "todo",
  });

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/accueil");
  return null;
}

export async function updateTask(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireClient();
  const id = formData.get("id");
  const title = formData.get("title");
  if (typeof id !== "string" || !id) return "Tâche introuvable.";
  if (typeof title !== "string" || !title.trim()) return "Indiquez un intitulé.";

  const dueDate = formData.get("due_date");
  const note = formData.get("note");
  const status = formData.get("status");

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: title.trim(),
      due_date: typeof dueDate === "string" && dueDate ? dueDate : null,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      status: status === "doing" || status === "done" ? status : "todo",
    })
    .eq("id", id)
    .eq("profile_id", session.userId);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/accueil");
  return null;
}

export async function setTaskStatus(id: string, status: "todo" | "doing" | "done"): Promise<void> {
  const session = await requireClient();
  const supabase = await createClient();
  await supabase.from("tasks").update({ status }).eq("id", id).eq("profile_id", session.userId);
  revalidatePath("/accueil");
}

export async function deleteTask(id: string): Promise<void> {
  const session = await requireClient();
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id).eq("profile_id", session.userId);
  revalidatePath("/accueil");
}
