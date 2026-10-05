import type { EntretienSummary, EntretienTone } from "@/lib/studio/entretien";

const TONE_BG: Record<EntretienTone, string> = {
  vert: "bg-studio-green",
  jaune: "bg-studio-amber",
  rouge: "bg-studio-red",
};

// STU-CLIENT-03 (§5.1) : port de `.st-pill` dans `stClients()` — pastille
// pleine, couleur = seule information de statut ("pas de colonne État
// séparée"). Format identique au prototype : "date · +Xj" (en retard) ou
// "date · Xj" (jours restants). Jamais d'animation sur le rouge.
export default function EntretienCell({ summary }: { summary: EntretienSummary }) {
  const { nextDueDate, daysUntilNext, tone } = summary;

  if (!nextDueDate || daysUntilNext === null || !tone) {
    return <span className="text-xs text-studio-muted">Aucun entretien</span>;
  }

  const days = daysUntilNext < 0 ? `+${-daysUntilNext} j` : `${daysUntilNext} j`;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white ${TONE_BG[tone]}`}
    >
      {new Date(`${nextDueDate}T12:00:00`).toLocaleDateString("fr-FR")} · {days}
    </span>
  );
}
