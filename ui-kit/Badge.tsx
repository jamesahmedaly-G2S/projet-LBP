import type { ReactNode } from "react";

type Tone = "neutral" | "blue" | "green" | "amber" | "red";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-zinc-300 bg-zinc-50 text-zinc-600",
  blue: "border-blue-300 bg-blue-50 text-blue-700",
  green: "border-green-300 bg-green-50 text-green-700",
  amber: "border-amber-300 bg-amber-50 text-amber-700",
  red: "border-red-300 bg-red-50 text-red-700",
};

// ui-kit : pastille de statut réutilisée partout (workflow, entretiens,
// affectations...) — un seul endroit pour l'apparence, cf. STU-WORKFLOW.
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
