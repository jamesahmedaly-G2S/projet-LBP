/**
 * STU-VEILLE-04 (AUTOMATION-02 côté James, issues #85-87) — un connecteur
 * par source officielle. `run()` ne lance jamais d'exception : toute
 * défaillance (source injoignable, configuration manquante) se traduit par
 * un `ConnectorResult.status`, journalisé et affiché tel quel côté Studio —
 * jamais une entrée `legal_monitoring` inventée pour compenser.
 */
export type ConnectorStatus = "ok" | "not_configured" | "error";

export interface ConnectorResult {
  key: string;
  label: string;
  status: ConnectorStatus;
  itemsFound: number;
  itemsInserted: number;
  message?: string;
}

export interface MonitoringConnector {
  key: string;
  label: string;
  /** Vrai si la source est réellement interrogée (pas un stub). */
  implemented: boolean;
  run: () => Promise<ConnectorResult>;
}
