/**
 * Libellés du statut de veille réglementaire (`regulatory_status`,
 * enum de James — `legal_monitoring`, baseline_schema_reel.sql). 3 valeurs
 * réelles : new/linked/processed. Le dossier Studio parle de "qualifiée"
 * (§9) là où la colonne réelle dit "linked" — même état, vocabulaire
 * différent ; on garde le libellé du dossier à l'affichage sans renommer
 * la colonne de James.
 */
export type MonitoringStatus = "new" | "linked" | "processed";

export const MONITORING_STATUS_LABELS: Record<MonitoringStatus, string> = {
  new: "Nouvelle",
  linked: "Qualifiée",
  processed: "Traitée",
};

export function getMonitoringStatusLabel(status: string): string {
  return MONITORING_STATUS_LABELS[status as MonitoringStatus] ?? status;
}

export const MONITORING_STATUS_TONES: Record<
  MonitoringStatus,
  "neutral" | "blue" | "green" | "amber" | "red"
> = {
  new: "amber",
  linked: "blue",
  processed: "green",
};

export function getMonitoringStatusTone(status: string) {
  return MONITORING_STATUS_TONES[status as MonitoringStatus] ?? "neutral";
}
