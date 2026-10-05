import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { runAllConnectorsAndNotify } from "@/lib/studio/monitoring-connectors";

/**
 * STU-VEILLE-04 (AUTOMATION-01, #85) : route cron, aucune session requise —
 * protégée par un secret partagé (header `x-cron-secret`), destinée à être
 * appelée par un ordonnanceur externe (supercronic/ofelia en production,
 * §3.2-3.3 du cahier). Le déclenchement planifié à 10h30 heure de Paris
 * lui-même (conteneur cron + docker-compose) est une préoccupation
 * d'infrastructure de déploiement, hors de ce dépôt local — cette route
 * est le code applicatif réel que ce cron appellerait.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  const expected = process.env.VEILLE_CRON_SECRET;

  if (!expected) {
    return NextResponse.json({ error: "VEILLE_CRON_SECRET non configuré." }, { status: 500 });
  }
  if (secret !== expected) {
    return NextResponse.json({ error: "Secret invalide ou manquant." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { results, notification } = await runAllConnectorsAndNotify(supabase);

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    results,
    notification,
  });
}
