import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const CONTROL_CLASSES =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function Wrapper({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
      {label}
      {children}
    </label>
  );
}

// ui-kit : label + champ toujours ensemble, même style de bordure/focus
// partout (au lieu de le redéfinir dans chaque formulaire du Studio).
export function TextField({
  label,
  className = "",
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper label={label}>
      <input className={`${CONTROL_CLASSES} ${className}`} {...props} />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  className = "",
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper label={label}>
      <textarea className={`${CONTROL_CLASSES} ${className}`} {...props} />
    </Wrapper>
  );
}

export function SelectField({
  label,
  className = "",
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper label={label}>
      <select className={`${CONTROL_CLASSES} bg-white ${className}`} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

// Case à cocher — libellé à droite plutôt qu'au-dessus (Wrapper ne
// convient pas pour ce contrôle), même classes de focus que les autres
// champs.
export function CheckboxField({
  label,
  className = "",
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-1 focus:ring-blue-500 ${className}`}
        {...props}
      />
      {label}
    </label>
  );
}
