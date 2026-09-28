"use client";

import { useActionState } from "react";
import { saveSoftwareStack } from "./actions";
import { TextField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

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
      <TextField
        label="Gestion des temps (GTA)"
        name="time_management"
        defaultValue={timeManagement ?? ""}
      />
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
