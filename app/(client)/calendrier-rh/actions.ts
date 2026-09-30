"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// LBP-CLIENT-15 : pendant de saveDayEvent() (LBP_V9.9_Studio.html) --
// n'expose que scope "personal"/"company" (jamais "national", réservé à
// l'admin -- de toute façon refusé par calendar_events_scope si un client
// essayait). company_id/profile_id sont mutuellement exclusifs selon la
// portée choisie, jamais les deux renseignés.
export async function addOwnEvent(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireClient();
  const title = formData.get("title");
  const eventDate = formData.get("event_date");
  const scope = formData.get("scope");
  const eventType = formData.get("event_type");

  if (typeof title !== "string" || !title.trim()) return "Indiquez un intitulé.";
  if (typeof eventDate !== "string" || !eventDate) return "Indiquez une date.";
  if (scope !== "personal" && scope !== "company") return "Portée invalide.";
  if (eventType !== "mandatory" && eventType !== "advisory" && eventType !== "news")
    return "Type invalide.";

  const priorityRaw = formData.get("priority");
  const priority = typeof priorityRaw === "string" && priorityRaw ? Number(priorityRaw) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert({
    company_id: scope === "company" ? session.profile.company_id : null,
    profile_id: scope === "personal" ? session.userId : null,
    scope,
    event_date: eventDate,
    title: title.trim(),
    category: str(formData.get("category")),
    event_type: eventType,
    priority,
    note: str(formData.get("note")),
    published: true,
  });

  if (error) return `Erreur : ${error.message}`;

  revalidatePath("/calendrier-rh");
  return null;
}

export async function deleteOwnEvent(id: string): Promise<void> {
  const session = await requireClient();
  const supabase = await createClient();
  // RLS (calendar_events_scope) restreint déjà la suppression aux lignes
  // propres (company_id = sa société ou profile_id = son propre id) --
  // filtre explicite en plus, défense en profondeur, même discipline que
  // le reste du projet.
  await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .or(`profile_id.eq.${session.userId},company_id.eq.${session.profile.company_id ?? ""}`);
  revalidatePath("/calendrier-rh");
}
