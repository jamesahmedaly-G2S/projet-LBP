import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorResult } from "./types";
import { createMinistereTravailConnector } from "./ministere-travail";
import { createHtmlScrapingConnectors } from "./html-scraping";
import { createLegifranceConnector } from "./legifrance";
import { sendVeilleNotification, type NotificationResult } from "../monitoring-notifications";
import { notifyAdmins } from "../content-notifications";

export type { ConnectorResult, ConnectorStatus, MonitoringConnector } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMonitoringConnectors(supabase: SupabaseClient<any, any, any>) {
  return [
    createMinistereTravailConnector(supabase),
    ...createHtmlScrapingConnectors(supabase),
    createLegifranceConnector(supabase),
  ];
}

/**
 * Exécute les 7 connecteurs (AUTOMATION-01/02, #85-86) et agrège le
 * résultat — appelé à la fois par la route cron `/api/cron/veille` et par
 * le déclenchement manuel côté Studio, même logique, une seule source de
 * vérité.
 */
export async function runAllConnectors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<ConnectorResult[]> {
  const connectors = getMonitoringConnectors(supabase);
  return Promise.all(connectors.map((connector) => connector.run()));
}

/**
 * Comme `runAllConnectors`, mais envoie en plus la notification
 * e-mail/SMS (Pauline, CR 10/09 — étape explicitement attendue du circuit
 * de bout en bout) quand au moins une entrée a réellement été insérée, et
 * une notification in-app réelle par entrée détectée (audience='admin',
 * LBP-CLIENT-11 finitions) -- pendant de `addNotif('g2s','veille',...)`
 * dans le vrai prototype, jusqu'ici seul le canal e-mail/SMS existait de
 * ce côté-ci. Séparée de `runAllConnectors` pour que les appelants qui ne
 * veulent pas de notification (ex. futurs tests) puissent continuer à
 * utiliser la fonction simple.
 */
export async function runAllConnectorsAndNotify(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<{ results: ConnectorResult[]; notification: NotificationResult }> {
  const results = await runAllConnectors(supabase);
  const newItems = results.flatMap((r) => r.insertedItems ?? []);
  const notification = await sendVeilleNotification(newItems);
  await Promise.all(
    newItems.map((item) =>
      notifyAdmins(supabase, {
        kind: "veille",
        title: `Nouvelle veille détectée : ${item.title}`,
        detail: item.source,
      }),
    ),
  );
  return { results, notification };
}
