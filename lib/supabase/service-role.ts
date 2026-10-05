import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * STU-VEILLE-04 : client service_role, réservé aux contextes sans session
 * utilisateur (Route Handler cron appelé par un ordonnanceur externe,
 * AUTOMATION-01/#85) — contourne RLS volontairement, jamais utilisé côté
 * requêtes déclenchées par un utilisateur (celles-ci passent par
 * lib/supabase/server.ts + requireAdmin()).
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
