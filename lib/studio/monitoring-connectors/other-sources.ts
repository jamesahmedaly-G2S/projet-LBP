import type { ConnectorResult, MonitoringConnector } from "./types";

/**
 * STU-VEILLE-04 — les 6 sources restantes des 7 visées par AUTOMATION-02
 * (#86). Chacune est un stub honnête, jamais une simulation : `run()`
 * renvoie explicitement pourquoi elle ne tourne pas encore, sans écrire la
 * moindre ligne dans `legal_monitoring`. Légifrance nécessite l'API PISTE
 * (OAuth2, `LEGIFRANCE_CLIENT_ID`/`SECRET`) ; les 5 autres sont, même côté
 * James, encore au stade "sélecteurs de scraping à définir" (#86) — pas de
 * flux public trouvé pendant le développement (URSSAF, BOSS et
 * bulletin-officiel.travail.gouv.fr injoignables depuis cet environnement ;
 * code.travail.gouv.fr atteignable mais sans flux RSS découvert).
 */
function stub(key: string, label: string, reason: string): MonitoringConnector {
  return {
    key,
    label,
    implemented: false,
    async run(): Promise<ConnectorResult> {
      return {
        key,
        label,
        status: "not_configured",
        itemsFound: 0,
        itemsInserted: 0,
        message: reason,
      };
    },
  };
}

export function createOtherSourceConnectors(): MonitoringConnector[] {
  return [
    stub(
      "legifrance",
      "Légifrance / JORF",
      "API PISTE (OAuth2) requise — LEGIFRANCE_CLIENT_ID/SECRET non configurés (AUTOMATION-02, #86).",
    ),
    stub(
      "boss",
      "BOSS",
      "Aucun flux public identifié, injoignable depuis cet environnement — sélecteur de scraping à définir (#86).",
    ),
    stub(
      "urssaf",
      "URSSAF",
      "Aucun flux public identifié, injoignable depuis cet environnement — sélecteur de scraping à définir (#86).",
    ),
    stub(
      "code-travail-numerique",
      "Code du travail numérique",
      "Domaine atteignable mais aucun flux RSS public découvert — sélecteur de scraping à définir (#86).",
    ),
    stub(
      "ameli",
      "Ameli",
      "Aucun flux public identifié, injoignable depuis cet environnement — sélecteur de scraping à définir (#86).",
    ),
    stub(
      "bocc",
      "BOCC",
      "Diffusé via Légifrance — bloqué par la même dépendance à l'API PISTE (#86).",
    ),
  ];
}
