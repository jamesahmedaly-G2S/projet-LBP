import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "border border-zinc-300 text-zinc-700 hover:bg-zinc-50",
};

// ui-kit : même rendu que Button, mais pour une navigation (Link) plutôt
// qu'une action de formulaire.
export function LinkButton({
  variant = "secondary",
  className = "",
  ...props
}: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return (
    <Link
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
