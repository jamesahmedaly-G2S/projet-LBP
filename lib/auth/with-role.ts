import { NextResponse, type NextRequest } from "next/server";
import { AuthError, requireRole } from "@/lib/auth/session";
import type { Session, UserRole } from "@/lib/auth/types";

type RouteHandler<Ctx = unknown> = (
  request: NextRequest,
  session: Session,
  context: Ctx,
) => Promise<Response>;

/**
 * Enveloppe un Route Handler pour le restreindre a une liste de roles
 * applicatifs. Renvoie 401 (non authentifie) ou 403 (role insuffisant)
 * avant d'executer le handler.
 */
export function withRole<Ctx = unknown>(roles: UserRole[], handler: RouteHandler<Ctx>) {
  return async (request: NextRequest, context: Ctx) => {
    try {
      const session = await requireRole(roles);
      return await handler(request, session, context);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }
  };
}
