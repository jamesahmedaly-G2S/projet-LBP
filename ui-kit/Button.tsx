import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover disabled:bg-primary-soft",
  secondary: "border border-border text-ink hover:bg-page-bg disabled:opacity-50",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-danger-bg",
  ghost: "text-muted hover:bg-primary-soft disabled:opacity-50",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

// ui-kit : bouton unique pour tout le Studio — évite de redéfinir les
// mêmes classes Tailwind dans chaque écran (principe DRY d'ARCHITECTURE.md).
export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
