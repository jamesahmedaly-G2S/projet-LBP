import type { ConnectorResult, MonitoringConnector } from "./types";

/**
 * STU-VEILLE-04 — seule source des 7 (AUTOMATION-02, #86) restée un stub
 * honnête : Légifrance/JORF. L'annexe 5.1 du cahier des charges réel
 * (`LBP_Cahier_des_charges_et_technique-3.pdf`) confirme que même le code
 * de référence de James laisse ce cas explicitement "TODO" — l'API PISTE
 * (OAuth2) n'a jamais été implémentée nulle part, ici ou ailleurs. Les 5
 * autres sources (BOSS, URSSAF, Code du travail numérique, Ameli, BOCC)
 * sont de vrais connecteurs de scraping — voir `html-scraping.ts`.
 */
export function createOtherSourceConnectors(): MonitoringConnector[] {
  return [
    {
      key: "legifrance",
      label: "Légifrance / JORF",
      implemented: false,
      async run(): Promise<ConnectorResult> {
        return {
          key: "legifrance",
          label: "Légifrance / JORF",
          status: "not_configured",
          itemsFound: 0,
          itemsInserted: 0,
          message:
            "API PISTE (OAuth2) requise — LEGIFRANCE_CLIENT_ID/SECRET non configurés. " +
            "Non implémentée non plus dans le code de référence du cahier des charges (annexe 5.1, marquée TODO).",
        };
      },
    },
  ];
}
