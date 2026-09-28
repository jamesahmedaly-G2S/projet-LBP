import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorResult, MonitoringConnector } from "./types";
import type { RssItem } from "./rss";
import { insertNewItems } from "./insert-items";

const LABEL = "Légifrance / JORF";
const MAX_ITEMS = 5;

/**
 * STU-VEILLE-04 (AUTOMATION-02, #86) — API PISTE (OAuth2), Annexe A §10.2
 * du cahier des charges réel : inscription obligatoire sur
 * piste.gouv.fr/registration, hosts confirmés par l'annexe elle-même
 * (`oauth.piste.gouv.fr` / `api.piste.gouv.fr/dila/legifrance/lf-engine-app`,
 * variantes sandbox préfixées `sandbox-`). Le flux OAuth2 client_credentials
 * ci-dessous suit ce contrat documenté à l'identique.
 *
 * Contrairement à Anthropic/Brevo (STU-VEILLE-04, AUTOMATION-03),
 * l'annexe elle-même laisse l'endpoit JORF en TODO sans forme de réponse
 * précisée, et aucune clé PISTE réelle n'est disponible pour observer une
 * vraie réponse. `/consult/lastNJo` (endpoint public documenté de l'API
 * Légifrance, {nbElement} -> liste des N derniers JO) est appelé pour de
 * vrai, mais le parsing des champs de chaque résultat reste du
 * best-effort non vérifié (plusieurs noms de champs plausibles essayés en
 * cascade) — à corriger la première fois qu'un vrai appel réussira,
 * exactement comme les sélecteurs CSS BOSS/URSSAF ont dû l'être après
 * l'annexe. Le filtrage "textes du Ministère du travail" demandé par
 * l'annexe demanderait le sommaire détaillé de chaque JO (endpoint
 * encore moins certain) : non tenté, ce connecteur remonte les éditions
 * de JO telles quelles plutôt que d'inventer un filtre non vérifiable.
 */

const OAUTH_HOSTS = {
  production: "https://oauth.piste.gouv.fr/api/oauth/token",
  sandbox: "https://sandbox-oauth.piste.gouv.fr/api/oauth/token",
};
const API_HOSTS = {
  production: "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app",
  sandbox: "https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app",
};

async function getAccessToken(env: "production" | "sandbox"): Promise<string> {
  const response = await fetch(OAUTH_HOSTS[env], {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.LEGIFRANCE_CLIENT_ID!,
      client_secret: process.env.LEGIFRANCE_CLIENT_SECRET!,
      scope: "openid",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`OAuth PISTE HTTP ${response.status} : ${await response.text()}`);
  }
  const data = await response.json();
  if (typeof data.access_token !== "string") {
    throw new Error("Réponse OAuth PISTE sans access_token.");
  }
  return data.access_token;
}

// Forme de réponse non vérifiée (pas de clé réelle disponible) : plusieurs
// noms de champs plausibles essayés en cascade plutôt qu'un seul deviné.
interface LastNJoRawResult {
  id?: string;
  cid?: string;
  dateParution?: string;
  date?: string;
  numero?: string | number;
  titre?: string;
  titrefull?: string;
  [key: string]: unknown;
}

function toRssItem(raw: LastNJoRawResult): RssItem | null {
  const date = raw.dateParution ?? raw.date ?? null;
  const id = raw.id ?? raw.cid ?? null;
  if (!date && !id) return null;

  const title = raw.titre ?? raw.titrefull ?? (date ? `Journal officiel du ${date}` : `JO ${id}`);
  const link = id
    ? `https://www.legifrance.gouv.fr/jorf/id/${id}`
    : `https://www.legifrance.gouv.fr/jorf/jo/${date}`;

  return { title, link, pubDate: date, description: null };
}

export function createLegifranceConnector(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): MonitoringConnector {
  return {
    key: "legifrance",
    label: LABEL,
    implemented: true,
    async run(): Promise<ConnectorResult> {
      const clientId = process.env.LEGIFRANCE_CLIENT_ID;
      const clientSecret = process.env.LEGIFRANCE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return {
          key: "legifrance",
          label: LABEL,
          status: "not_configured",
          itemsFound: 0,
          itemsInserted: 0,
          message:
            "LEGIFRANCE_CLIENT_ID/SECRET non configurés — inscription requise sur " +
            "piste.gouv.fr/registration (Annexe A §10.2 du cahier des charges).",
        };
      }

      const env = process.env.LEGIFRANCE_ENV === "sandbox" ? "sandbox" : "production";

      let token: string;
      try {
        token = await getAccessToken(env);
      } catch (e) {
        return {
          key: "legifrance",
          label: LABEL,
          status: "error",
          itemsFound: 0,
          itemsInserted: 0,
          message: `Authentification PISTE échouée : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }

      let response: Response;
      try {
        response = await fetch(`${API_HOSTS[env]}/consult/lastNJo`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nbElement: MAX_ITEMS }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch (e) {
        return {
          key: "legifrance",
          label: LABEL,
          status: "error",
          itemsFound: 0,
          itemsInserted: 0,
          message: `API PISTE injoignable : ${e instanceof Error ? e.message : "erreur réseau"}`,
        };
      }

      if (!response.ok) {
        return {
          key: "legifrance",
          label: LABEL,
          status: "error",
          itemsFound: 0,
          itemsInserted: 0,
          message: `API PISTE HTTP ${response.status} : ${await response.text()}`,
        };
      }

      const data = await response.json();
      const rawResults: LastNJoRawResult[] = Array.isArray(data)
        ? data
        : (data.results ?? data.jo ?? []);
      const items = rawResults.map(toRssItem).filter((item): item is RssItem => item !== null);

      const { inserted, insertedItems, error } = await insertNewItems(supabase, LABEL, items);
      if (error) {
        return {
          key: "legifrance",
          label: LABEL,
          status: "error",
          itemsFound: items.length,
          itemsInserted: 0,
          message: `Erreur d'écriture : ${error}`,
        };
      }

      return {
        key: "legifrance",
        label: LABEL,
        status: "ok",
        itemsFound: items.length,
        itemsInserted: inserted,
        insertedItems,
      };
    },
  };
}
