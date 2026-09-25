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

  redirect(profile?.role === "admin" ? "/referentiel" : "/");
}
