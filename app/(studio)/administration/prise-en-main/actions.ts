"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function saveHelpSettings(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const title = formData.get("title");
  const pointsRaw = formData.get("points");

  if (typeof title !== "string" || !title.trim()) return "Le titre est obligatoire.";
  if (typeof pointsRaw !== "string") return "Les points sont obligatoires.";

  const points = pointsRaw
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  if (points.length === 0) return "Indiquez au moins un point clé.";

  const supabase = await createClient();
  const { error } = await supabase
    .from("help_page_settings")
    .update({
      title: title.trim(),
      points,
      video_title: str(formData.get("video_title")) ?? "La vidéo de présentation",
      video_text: str(formData.get("video_text")) ?? "",
      video_url: str(formData.get("video_url")),
    })
    .eq("id", 1);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/administration/prise-en-main");
  revalidatePath("/prise-en-main");
  return "Enregistré.";
}

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
