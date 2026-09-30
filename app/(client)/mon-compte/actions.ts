"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ALL_NOTIFICATION_KINDS, NOTIFICATION_CHANNELS } from "@/lib/client/notification-kinds";

// LBP-CLIENT-10 : "Mon compte" [§1.11, p.12-13] — infos perso sur
// `profiles` (déjà en base, jamais éditées par le client lui-même avant
// ce ticket), changement de mot de passe via l'API Supabase Auth réelle
// (`updateUser()`, jamais branché nulle part dans l'app, ni Studio ni
// client, jusqu'ici).
export async function updateMyProfile(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireClient();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      job_title: str(formData.get("job_title")),
      department: str(formData.get("department")),
      phone: str(formData.get("phone")),
    })
    .eq("id", session.userId);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/mon-compte");
  return "Enregistré.";
}

export async function changeMyPassword(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireClient();
  const password = formData.get("password");
  const confirm = formData.get("confirm");

  if (typeof password !== "string" || password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (password !== confirm) {
    return "Les deux mots de passe ne correspondent pas.";
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return `Erreur : ${error.message}`;
  return "Mot de passe modifié.";
}

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// LBP-CLIENT-10/11 (finitions, 30/09/2026) : "Mes notifications" --
// dernier bloc de Mon compte. Un seul bouton enregistre les préférences de
// tous les types d'un coup (`saveAccount()` du prototype fait de même) --
// upsert plutôt qu'update, une ligne n'existe pas tant que l'utilisateur
// n'a jamais changé la valeur par défaut ("lbp") pour ce type.
export async function saveNotificationPreferences(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireClient();
  const supabase = await createClient();

  const rows = ALL_NOTIFICATION_KINDS.map((k) => {
    const raw = formData.get(`channel_${k.key}`);
    const channel = NOTIFICATION_CHANNELS.includes(raw as (typeof NOTIFICATION_CHANNELS)[number])
      ? (raw as (typeof NOTIFICATION_CHANNELS)[number])
      : "lbp";
    return { profile_id: session.userId, kind: k.key, channel };
  });

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(rows, { onConflict: "profile_id,kind" });

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/mon-compte");
  return "Préférences enregistrées.";
}
