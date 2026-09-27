"use client";

import { useActionState } from "react";
import { createClientCompany } from "./actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export default function NewCompanyForm({
  offers,
}: {
  offers: { tier_level: number; name: string; price_label: string }[];
}) {
  const [error, formAction, pending] = useActionState(createClientCompany, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        label="Raison sociale"
        name="company_name"
        required
        placeholder="Ex. DELTA INDUSTRIES"
      />
      <SelectField
        label="Offre souscrite"
        name="offer_tier"
        defaultValue={offers[1]?.tier_level ?? 1}
      >
        {offers.map((o) => (
          <option key={o.tier_level} value={o.tier_level}>
            {o.name} — {o.price_label}
          </option>
        ))}
      </SelectField>

      {error && <p className="text-sm text-studio-red">{error}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="w-fit">
        {pending ? "..." : "Continuer"}
      </Button>
    </form>
  );
}
