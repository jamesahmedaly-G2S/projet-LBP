"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// LBP-CLIENT-06 : quiz_scores existe déjà dans le schéma réel de James
// (baseline_schema_reel.sql) avec sa policy `quiz_scores_own` (un profil
// n'écrit/lit que ses propres scores) — jamais touché, juste consommé.
export async function submitQuizScore(quizId: string, score: number): Promise<string | null> {
  const session = await requireClient();
  const supabase = await createClient();

  const { error } = await supabase.from("quiz_scores").insert({
    profile_id: session.userId,
    quiz_id: quizId,
    score,
  });

  if (error) return `Erreur lors de l'enregistrement du score : ${error.message}`;
  revalidatePath("/mes-quiz");
  return null;
}
