export type UserRole = "admin" | "client";

/** Sous-ensemble des claims du JWT Supabase Auth utilise par l'application. */
export interface Claims {
  sub: string;
  email?: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  company_id: string | null;
  full_name: string;
  has_onboarding_tour: boolean;
  /** Palier commercial de la societe (companies.offer_tier) ; null si aucune societe rattachee. */
  offer_tier: number | null;
}

export interface Session {
  userId: string;
  profile: Profile;
}
