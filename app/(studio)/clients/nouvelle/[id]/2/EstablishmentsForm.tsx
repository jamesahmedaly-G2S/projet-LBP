"use client";

import { useState, useTransition } from "react";
import { saveEstablishments } from "../../actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

interface Establishment {
  name: string;
  address: string;
}

// Port de l'étape 2 (`wzAddEtab()`, `.wz-et-n`/`.wz-et-a`) — lignes
// dynamiques nom/adresse.
export default function EstablishmentsForm({
  companyId,
  initial,
}: {
  companyId: string;
  initial: Establishment[];
}) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateRow(i: number, field: keyof Establishment, value: string) {
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  function save() {
    startTransition(async () => {
      const error = await saveEstablishments(companyId, rows);
      setMessage(error ?? "Enregistré.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex-1">
            <TextField
              label="Nom de l'établissement"
              value={row.name}
              onChange={(e) => updateRow(i, "name", e.target.value)}
              placeholder="Ex. Siège — Paris"
            />
          </div>
          <div className="flex-1">
            <TextField
              label="Adresse"
              value={row.address}
              onChange={(e) => updateRow(i, "address", e.target.value)}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        className="w-fit"
        onClick={() => setRows((prev) => [...prev, { name: "", address: "" }])}
      >
        + Ajouter un établissement
      </Button>

      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" disabled={pending} onClick={save} className="w-fit">
          {pending ? "Enregistrement..." : "Enregistrer les établissements"}
        </Button>
        {message && <p className="text-sm text-studio-muted">{message}</p>}
      </div>
    </div>
  );
}
