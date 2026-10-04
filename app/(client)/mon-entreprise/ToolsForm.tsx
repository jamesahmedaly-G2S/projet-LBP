"use client";

import { useActionState } from "react";
import { saveSoftwareStack } from "./actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// Correctif fidélité (04/10/2026), suite à un retour de l'utilisateur
// ("compare mot pour mot") : libellé réel `<span class='k'>GTA</span>`
// (`renderDocs()`, ~L10246) -- pas "Gestion des temps (GTA)", une
// expansion inventée.
//
// Correctif (04/10/2026 bis), suite à un nouveau retour de l'utilisateur
// ("pas vraiment aligné avec les attentes de la v9 de pauline") :
// re-audit plus poussé, même erreur de source que PayrollForm.tsx --
// ToolsForm EST le modal d'édition (`#outilsEditor`, ~L12282-12289), pas
// la carte d'affichage (`outilsCard`, ~L10244-10249) dont "GTA" seul
// était tiré la première fois. Vrai libellé du modal : "GTA (gestion des
// temps)" (~L12286). Le champ "cahier des charges" était aussi une
// invention structurelle -- le vrai modal n'a pas de case à cocher mais
// un `<select>` à la question exacte "Un cahier des charges du logiciel
// de paie existe-t-il ?" (Non/Oui, ~L12288-12289) ; remplacé en
// conséquence (`has_specifications` reste le même booléen en base,
// seule la représentation du champ change).
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
        {message && (
          <p className={`text-xs ${message === "Enregistré." ? "text-success" : "text-danger"}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
