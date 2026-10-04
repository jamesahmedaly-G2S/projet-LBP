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
//
// Correctif (04/10/2026 bis), suite à un nouveau retour de l'utilisateur
// ("pas vraiment aligné avec les attentes de la v9 de pauline") : un
// re-audit plus poussé a trouvé que les libellés ci-dessus avaient été
// portés depuis la mauvaise source -- la carte d'affichage en lecture
// seule (`paieCard`, ~L10238-10241), pas le vrai modal d'édition
// (`#paieEditor`, ~L12275-12281), alors que PayrollForm EST
// fonctionnellement ce modal (un formulaire éditable), pas la carte.
// Vrais libellés du modal : "Mode d'organisation" (pas "Mode
// d'organisation de la paie" -- le bloc parent est déjà titré
// "Organisation de la paie", le modal ne répète pas le mot "paie") et
// "Prestataire de paie (le cas échéant)" avec le placeholder "Nom du
// prestataire" (pas "Le cas échéant" en placeholder).
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
        label="Mode d'organisation"
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
        label="Prestataire de paie (le cas échéant)"
        name="provider_name"
        defaultValue={providerName ?? ""}
        placeholder="Nom du prestataire"
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
