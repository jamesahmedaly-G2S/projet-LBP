"use client";

import { useActionState } from "react";
import { savePayrollOrg } from "./actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// Correctif fidélité (04/10/2026), suite à un retour de l'utilisateur
// ("compare mot pour mot") : le vrai champ (`#pe2-mode`,
// `LBP_V9.9_Studio.html` ~L12278) est un `<select>` à 4 options fixes
// ("Paie internalisée"/"Paie semi-internalisée"/"Paie externalisée"/
// "Prestataire de paie"), pas un champ texte libre avec un indice en
// placeholder -- `PAIE={mode:"Paie semi-internalisée",...}` confirme que
// c'est bien une de ces 4 valeurs exactes, jamais une saisie arbitraire.
const PAYROLL_MODES = [
  "Paie internalisée",
  "Paie semi-internalisée",
  "Paie externalisée",
  "Prestataire de paie",
];

export default function PayrollForm({
  operatingMode,
  providerName,
}: {
  operatingMode: string | null;
  providerName: string | null;
}) {
  const [message, formAction, pending] = useActionState(savePayrollOrg, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SelectField
        label="Mode d'organisation de la paie"
        name="operating_mode"
        defaultValue={operatingMode ?? ""}
      >
        <option value="">— À renseigner</option>
        {PAYROLL_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Prestataire de paie"
        name="provider_name"
        defaultValue={providerName ?? ""}
        placeholder="Le cas échéant"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        {message && (
          <p className={`text-xs ${message === "Enregistré." ? "text-success" : "text-danger"}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
