import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-studio-blue text-white hover:bg-studio-navy2 disabled:bg-studio-blue-soft",
  secondary: "border border-studio-line text-studio-navy hover:bg-studio-bg disabled:opacity-50",
  danger: "bg-studio-red text-white hover:bg-studio-red/90 disabled:bg-studio-red-bg",
  ghost: "text-studio-muted hover:bg-studio-blue-soft disabled:opacity-50",
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
