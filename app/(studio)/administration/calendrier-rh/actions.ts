"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notifyAllClients } from "@/lib/studio/content-notifications";

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// Gère exclusivement les évènements nationaux (scope='national',
// company_id/profile_id toujours null, jamais choisis par le formulaire --
// contrairement au client, l'admin ne gère pas ici les évènements propres
// à une société ou personnels).
export async function saveEvent(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const id = formData.get("id");
  const title = formData.get("title");
  const eventDate = formData.get("event_date");
  const eventType = formData.get("event_type");

  if (typeof title !== "string" || !title.trim()) return "L'intitulé est obligatoire.";
  if (typeof eventDate !== "string" || !eventDate) return "La date est obligatoire.";
  if (eventType !== "mandatory" && eventType !== "advisory" && eventType !== "news")
    return "Type invalide.";

  const data = {
    scope: "national" as const,
    company_id: null,
    profile_id: null,
    event_date: eventDate,
    title: title.trim(),
    category: str(formData.get("category")),
    event_type: eventType,
    note: str(formData.get("note")),
    published: formData.get("published") === "on",
  };

  const supabase = await createClient();

  let wasPublished = false;
  if (typeof id === "string" && id) {
    const { data: existing } = await supabase
      .from("calendar_events")
      .select("published")
      .eq("id", id)
      .single();
    wasPublished = existing?.published ?? false;
  }

  const { error } =
    typeof id === "string" && id
      ? await supabase.from("calendar_events").update(data).eq("id", id)
      : await supabase.from("calendar_events").insert(data);

  if (error) return `Erreur : ${error.message}`;

  // STU-WORKFLOW-07 : même pattern que Chiffres Paie/Dictionnaire/Offres/Actu
  // -- notifie seulement au vrai passage brouillon -> publié.
  if (data.published && !wasPublished) {
    await notifyAllClients(supabase, {
      kind: "calendrier-rh",
      title: `Nouvelle échéance au calendrier RH : ${data.title}`,
    });
  }

  revalidatePath("/administration/calendrier-rh");
  revalidatePath("/calendrier-rh");
  return null;
}

export async function deleteEvent(id: string): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/calendrier-rh");
  revalidatePath("/calendrier-rh");
  return null;
}
