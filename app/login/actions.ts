"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Ecran de login minimal pour les besoins de verification manuelle du
// pivot Studio (aucun ecran de login n'existe encore dans l'application ;
// celui-ci n'a pas vocation a remplacer AUTH-07/08/09 cote James, juste a
// debloquer les revues visuelles jusque-la).
export async function login(_prevState: string | null, formData: FormData): Promise<string | null> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return "Email et mot de passe requis.";
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return "Identifiants invalides.";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.session.user.id)
    .single();

  redirect(profile?.role === "admin" ? "/tableau-de-bord" : "/accueil");
}

// STU-DESIGN-01 (correctif 27/09/2026) : "Quitter le Studio" — dans le vrai
// prototype (`closeStudio()`, LBP_V6_Studio.html), ce bouton bascule vers
// la vue "LBP Client", qui n'existe pas encore côté Studio (STU-CLIENT-04,
// hors périmètre ici). En attendant, le libellé réel du bouton est gardé
// mais l'action est une vraie déconnexion Supabase Auth — jusqu'ici absente
// de toute l'application (STU-AUTH-01 l'excluait explicitement).
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
