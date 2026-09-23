import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour Route Handlers, Server Components et Server Actions.
 * Le `setAll` peut echouer depuis un Server Component (cookies en lecture
 * seule) : sans consequence tant que le proxy rafraichit la session sur
 * chaque requete (voir proxy.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appele depuis un Server Component : ignore, le proxy
            // rafraichit la session sur la requete suivante.
          }
        },
      },
    },
  );
}
