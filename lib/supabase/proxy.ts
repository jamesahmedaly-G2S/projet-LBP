import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Claims } from "@/lib/auth/types";

/**
 * Rafraichit la session Supabase (cookies) sur chaque requete et retourne
 * les claims du JWT valides, ou null si absent/invalide/expire. Utilise
 * getClaims() plutot que getSession()/getUser() : verifie le JWT
 * (localement si le projet utilise des cles de signature asymetriques,
 * sinon via l'API Auth) au lieu de faire confiance au cookie tel quel.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const claims = error ? null : ((data?.claims as Claims | undefined) ?? null);

  return { supabaseResponse, claims };
}
