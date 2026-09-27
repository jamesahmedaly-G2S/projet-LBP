import type { ReactNode } from "react";

type Tone = "neutral" | "blue" | "green" | "amber" | "red";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-studio-line bg-white text-studio-muted",
  blue: "border-studio-blue/30 bg-studio-blue-soft text-studio-blue",
  green: "border-studio-green/30 bg-studio-green-bg text-studio-green",
  amber: "border-studio-amber/30 bg-studio-amber-bg text-studio-amber",
  red: "border-studio-red/30 bg-studio-red-bg text-studio-red",
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
