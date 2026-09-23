import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Prefixes de routes qui exigent une session valide. A completer au fur et
// a mesure que de nouvelles routes protegees sont ajoutees (le controle
// fin par role reste au niveau de chaque route/Server Action via
// requireRole()/withRole(), pas ici).
const PROTECTED_PREFIXES = ["/api/profiles"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, claims } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !claims) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
