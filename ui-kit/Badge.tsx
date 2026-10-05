import type { ReactNode } from "react";

type Tone = "neutral" | "blue" | "green" | "amber" | "red";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-border bg-white text-muted",
  blue: "border-primary/30 bg-primary-soft text-primary",
  green: "border-success/30 bg-success-bg text-success",
  amber: "border-warning/30 bg-warning-bg text-warning",
  red: "border-danger/30 bg-danger-bg text-danger",
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
