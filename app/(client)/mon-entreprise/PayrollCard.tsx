"use client";

import { useActionState, useState } from "react";
import { savePayrollOrg } from "./actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Modal } from "@/ui-kit/Modal";

// Correctif (04/10/2026), suite au retour de l'utilisateur ("le contenu
// et la longueur à l'intérieur ça ne match pas avec la v9") : le vrai
// `paieCard` (`renderDocs()`, `LBP_V9.9_Studio.html` ~L10238-10241) est
// une carte d'affichage compacte -- `.paie-mode` (le mode courant en
// gros, 20px/800) + prestataire en `.id-row` + l'indice italique
// `.paie-opts` ("Options possibles : internalisée · semi-internalisée ·
// externalisée · prestataire de paie", texte réel, pas "Paie ..." répété
// 4 fois) -- jamais un `<select>` affiché en permanence. Édition
// déplacée dans un `Modal` (`#paieEditor`, ~L12275-12281).
const PAYROLL_MODES = [
  "Paie internalisée",
  "Paie semi-internalisée",
  "Paie externalisée",
  "Prestataire de paie",
];

export default function PayrollCard({
  operatingMode,
  providerName,
}: {
  operatingMode: string | null;
  providerName: string | null;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Modifier l'organisation de la paie"
        className="absolute top-0 right-0 rounded-full p-1.5 text-base text-muted opacity-75 hover:bg-surface hover:opacity-100"
      >
        ✏️
      </button>

      <div className="pr-7 text-xl font-extrabold text-[#445068]">
        {operatingMode || <span className="text-base font-normal text-muted">À renseigner</span>}
      </div>
      {providerName && (
        <div className="flex items-center justify-between gap-3.5 border-b border-border py-2 pr-7 text-[13.5px]">
          <span className="text-muted">Prestataire de paie</span>
          <span className="font-bold text-ink">{providerName}</span>
        </div>
      )}
      <p className="mt-2.5 text-[11.5px] text-muted italic">
        Options possibles : internalisée · semi-internalisée · externalisée · prestataire de paie
      </p>

      <Modal open={editing} onClose={() => setEditing(false)} title="Organisation de la paie">
        <PayrollForm
          operatingMode={operatingMode}
          providerName={providerName}
          onDone={() => setEditing(false)}
        />
      </Modal>
    </div>
  );
}

function PayrollForm({
  operatingMode,
  providerName,
  onDone,
}: {
  operatingMode: string | null;
  providerName: string | null;
  onDone: () => void;
}) {
  const [message, formAction, pending] = useActionState(
    async (prev: string | null, fd: FormData) => {
      const result = await savePayrollOrg(prev, fd);
      if (result === "Enregistré.") onDone();
      return result;
    },
    null,
  );

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
        {message && message !== "Enregistré." && <p className="text-xs text-danger">{message}</p>}
      </div>
    </form>
  );
}
