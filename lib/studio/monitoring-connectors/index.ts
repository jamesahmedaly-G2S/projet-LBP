import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorResult } from "./types";
import { createMinistereTravailConnector } from "./ministere-travail";
import { createHtmlScrapingConnectors } from "./html-scraping";
import { createOtherSourceConnectors } from "./other-sources";

export type { ConnectorResult, ConnectorStatus, MonitoringConnector } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMonitoringConnectors(supabase: SupabaseClient<any, any, any>) {
  return [
    createMinistereTravailConnector(supabase),
    ...createHtmlScrapingConnectors(supabase),
    ...createOtherSourceConnectors(),
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
