"use client";

import { useActionState } from "react";
import { saveSoftwareStack } from "./actions";
import { TextField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// Correctif fidélité (04/10/2026), suite à un retour de l'utilisateur
// ("compare mot pour mot") : libellé réel `<span class='k'>GTA</span>`
// (`renderDocs()`, ~L10246) -- pas "Gestion des temps (GTA)", une
// expansion inventée.
export default function ToolsForm({
  payrollSoftware,
  hris,
  timeManagement,
  otherTools,
  hasSpecifications,
}: {
  payrollSoftware: string | null;
  hris: string | null;
  timeManagement: string | null;
  otherTools: string | null;
  hasSpecifications: boolean;
}) {
  const [message, formAction, pending] = useActionState(saveSoftwareStack, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <TextField
        label="Logiciel de paie"
        name="payroll_software"
        defaultValue={payrollSoftware ?? ""}
      />
      <TextField label="SIRH" name="hris" defaultValue={hris ?? ""} />
      <TextField label="GTA" name="time_management" defaultValue={timeManagement ?? ""} />
      <TextField label="Autres outils RH" name="other_tools" defaultValue={otherTools ?? ""} />
      <CheckboxField
        label="Cahier des charges du logiciel de paie disponible"
        name="has_specifications"
        defaultChecked={hasSpecifications}
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
