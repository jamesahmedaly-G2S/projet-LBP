import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorResult, MonitoringConnector } from "./types";
import { parseRssItems } from "./rss";
import { insertNewItems } from "./insert-items";

const FEED_URL = "https://travail-emploi.gouv.fr/rss.xml";
const LABEL = "Ministère du travail";
const MAX_ITEMS = 10;

/**
 * STU-VEILLE-04 (AUTOMATION-02, #86) — seule source des 7 dont le flux
 * public a été vérifié accessible sans authentification pendant le
 * développement (fetch réel testé, 200, items RSS réels). Légifrance
 * (`legifrance.ts`) exige une clé PISTE non fournie — reste en état "non
 * configuré" honnête plutôt que simulé.
 */
export function createMinistereTravailConnector(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): MonitoringConnector {
  return {
    key: "ministere-travail",
    label: LABEL,
    implemented: true,
    async run(): Promise<ConnectorResult> {
      let response: Response;
      try {
        response = await fetch(FEED_URL, { signal: AbortSignal.timeout(10_000) });
      } catch (e) {
        return {
          key: "ministere-travail",
          label: LABEL,
          status: "error",
          itemsFound: 0,
          itemsInserted: 0,
          message: `Flux injoignable : ${e instanceof Error ? e.message : "erreur réseau"}`,
        };
      }

      if (!response.ok) {
        return {
          key: "ministere-travail",
          label: LABEL,
          status: "error",
          itemsFound: 0,
          itemsInserted: 0,
          message: `Réponse HTTP ${response.status}`,
        };
      }

      const xml = await response.text();
      const items = parseRssItems(xml).slice(0, MAX_ITEMS);

      const { inserted, insertedItems, error } = await insertNewItems(supabase, LABEL, items);
      if (error) {
        return {
          key: "ministere-travail",
          label: LABEL,
          status: "error",
          itemsFound: items.length,
          itemsInserted: 0,
          message: `Erreur d'écriture : ${error}`,
        };
      }

      return {
        key: "ministere-travail",
        label: LABEL,
        status: "ok",
        itemsFound: items.length,
        itemsInserted: inserted,
        insertedItems,
      };
    },
  };
}
