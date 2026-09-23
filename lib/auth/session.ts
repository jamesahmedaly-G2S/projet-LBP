import { createClient } from "@/lib/supabase/server";
import type { Profile, Session, UserRole } from "@/lib/auth/types";

export class AuthError extends Error {
  status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.status = status;
  }
}

/**
 * Session courante (utilisateur + profil applicatif) a partir des cookies
 * de la requete. Leve AuthError(401) si absent d'un jeton valide, ou si le
 * profil correspondant n'existe pas (ne devrait pas arriver, le trigger
 * handle_new_user() le cree a l'inscription).
 */
export async function requireSession(): Promise<Session> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    throw new AuthError("Authentification requise", 401);
  }

  const userId = data.claims.sub as string;

  const { data: row, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, company_id, full_name, has_onboarding_tour, companies(offer_tier)")
    .eq("id", userId)
    .single();

  if (profileError || !row) {
    throw new AuthError("Authentification requise", 401);
  }

  // Sans types Supabase generes, le client infere les relations embarquees
  // comme des tableaux meme pour une FK to-one (profiles.company_id ->
  // companies.id) : on ne garde que la premiere entree.
  const company = (row.companies as { offer_tier: number }[] | null)?.[0] ?? null;

  const profile: Profile = {
    id: row.id,
    role: row.role,
    company_id: row.company_id,
    full_name: row.full_name,
    has_onboarding_tour: row.has_onboarding_tour,
    offer_tier: company?.offer_tier ?? null,
  };

  return { userId, profile };
}

/**
 * Restreint a une liste de roles applicatifs. "editor" n'existe pas comme
 * role distinct (user_role = admin/client, decision Note de cadrage p.13,
 * voir docs/adr/0004-modele-de-roles-a-2-valeurs.md) : requireAdmin()
 * couvre ce que le cahier des charges appelle "editor/admin".
 */
export async function requireRole(roles: UserRole[]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.profile.role)) {
    throw new AuthError("Accès refusé", 403);
  }
  return session;
}

export async function requireAdmin(): Promise<Session> {
  return requireRole(["admin"]);
}
