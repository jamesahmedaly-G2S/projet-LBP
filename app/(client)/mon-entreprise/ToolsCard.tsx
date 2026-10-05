"use client";

import { useActionState, useState } from "react";
import { saveSoftwareStack } from "./actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Modal } from "@/ui-kit/Modal";

// Correctif (04/10/2026), suite au retour de l'utilisateur ("le contenu
// et la longueur à l'intérieur ça ne match pas avec la v9") : le vrai
// `outilsCard` (`renderDocs()`, `LBP_V9.9_Studio.html` ~L10244-10249)
// est une carte d'affichage compacte en `.id-row` + un badge Oui/Non
// (`.badge-oui`/`.badge-non`, ~L736-737) pour le cahier des charges --
// jamais des champs de saisie en permanence visibles. Édition déplacée
// dans un `Modal` (`#outilsEditor`, ~L12282-12289).
function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3.5 border-b border-border py-2 text-[13.5px] last:border-b-0">
      <span className="text-muted">{label}</span>
      <span className="font-bold text-ink">{value || "—"}</span>
    </div>
  );
}

export default function ToolsCard({
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
  const [editing, setEditing] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Modifier les outils"
        className="absolute top-0 right-0 rounded-full p-1.5 text-base text-muted opacity-75 hover:bg-surface hover:opacity-100"
      >
        ✏️
      </button>

      <div className="pr-7">
        <Row label="Logiciel de paie" value={payrollSoftware} />
        <Row label="SIRH" value={hris} />
        <Row label="GTA" value={timeManagement} />
        <Row label="Autres outils RH" value={otherTools} />
        <div className="flex items-center justify-between gap-3.5 py-2 text-[13.5px]">
          <span className="text-muted">Cahier des charges du logiciel de paie</span>
          <span
            className={`rounded-lg px-2.5 py-0.5 text-xs font-extrabold ${
              hasSpecifications ? "bg-primary-soft text-primary" : "bg-[#DED9DB] text-[#8C2447]"
            }`}
          >
            {hasSpecifications ? "Oui" : "Non"}
          </span>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Outils">
        <ToolsForm
          payrollSoftware={payrollSoftware}
          hris={hris}
          timeManagement={timeManagement}
          otherTools={otherTools}
          hasSpecifications={hasSpecifications}
          onDone={() => setEditing(false)}
        />
      </Modal>
    </div>
  );
}

function ToolsForm({
  payrollSoftware,
  hris,
  timeManagement,
  otherTools,
  hasSpecifications,
  onDone,
}: {
  payrollSoftware: string | null;
  hris: string | null;
  timeManagement: string | null;
  otherTools: string | null;
  hasSpecifications: boolean;
  onDone: () => void;
}) {
  const [message, formAction, pending] = useActionState(
    async (prev: string | null, fd: FormData) => {
      const result = await saveSoftwareStack(prev, fd);
      if (result === "Enregistré.") onDone();
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <TextField
        label="Logiciel de paie"
        name="payroll_software"
        defaultValue={payrollSoftware ?? ""}
      />
      <TextField label="SIRH" name="hris" defaultValue={hris ?? ""} />
      <TextField
        label="GTA (gestion des temps)"
        name="time_management"
        defaultValue={timeManagement ?? ""}
      />
      <TextField label="Autres outils RH" name="other_tools" defaultValue={otherTools ?? ""} />
      <SelectField
        label="Un cahier des charges du logiciel de paie existe-t-il ?"
        name="has_specifications"
        defaultValue={hasSpecifications ? "oui" : "non"}
      >
        <option value="non">Non</option>
        <option value="oui">Oui</option>
      </SelectField>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        {message && message !== "Enregistré." && <p className="text-xs text-danger">{message}</p>}
      </div>
    </form>
  );
}
