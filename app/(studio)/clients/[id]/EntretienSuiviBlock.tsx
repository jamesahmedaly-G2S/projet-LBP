import type { EntretienSummary, EntretienTone } from "@/lib/studio/entretien";

const TONE_BAR: Record<EntretienTone, string> = {
  vert: "bg-studio-green",
  jaune: "bg-studio-amber",
  rouge: "bg-studio-red",
};

const TONE_LABEL: Record<EntretienTone, string> = {
  vert: "À JOUR",
  jaune: "À ANTICIPER",
  rouge: "URGENT",
};

function frDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR");
}

// STU-CLIENT-02 : port du bloc "Suivi annuel" (`stClientFiche()`, fonction
// `sa()`). Volontairement AUCUNE animation (pas de `animate-pulse`/blink)
// sur l'état rouge — exigence explicite du dossier (§5.2).
export default function EntretienSuiviBlock({ summary }: { summary: EntretienSummary }) {
  const { lastDoneDate, nextDueDate, daysUntilNext, tone } = summary;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Box label="Dernier entretien" value={frDate(lastDoneDate)} tone={tone} />
      <Box
        label="Temps restant"
        value={
          daysUntilNext === null
            ? "—"
            : daysUntilNext < 0
              ? `${-daysUntilNext} jours de retard`
              : `${daysUntilNext} jours`
        }
        tone={tone}
      />
      <Box label="Prochain entretien" value={frDate(nextDueDate)} tone={tone} />
      <Box label="Suivi" value={tone ? TONE_LABEL[tone] : "—"} tone={tone} />
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone: EntretienTone | null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-studio-line bg-white">
      <div className="p-4">
        <div className="text-xs text-studio-muted">{label}</div>
        <div className="mt-1 text-lg font-bold text-studio-navy">{value}</div>
      </div>
      <div className={`h-1 ${tone ? TONE_BAR[tone] : "bg-studio-line"}`} />
    </div>
  );
}
