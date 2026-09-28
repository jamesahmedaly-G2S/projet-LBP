"use client";

import { useActionState } from "react";
import { savePayrollOrg } from "./actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

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
      <TextField
        label="Mode d'organisation de la paie"
        name="operating_mode"
        defaultValue={operatingMode ?? ""}
        placeholder="Internalisée, semi-internalisée, externalisée…"
      />
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
