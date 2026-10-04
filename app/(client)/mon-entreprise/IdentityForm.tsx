"use client";

import { useActionState } from "react";
import { saveCompanyIdentity } from "./actions";
import { TextField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// Correctif (04/10/2026), suite au retour de l'utilisateur ("on corrige
// de notre côté") : porte le vrai modal d'édition d'identité
// (`#identEditor`, `LBP_V9.9_Studio.html` ~L12261-12274) -- logo (upload
// + retrait, comme `identLogoPick()`/`removeLogo()`), SIRET, convention
// collective, raison sociale, forme, effectif global. Établissements
// reste un composant séparé (`EstablishmentsSection.tsx`, déjà fidèle) --
// le vrai modal les gère inline, mais notre architecture Server/Client
// Component les sépare déjà proprement, pas une raison de les fusionner.
export default function IdentityForm({
  companyName,
  legalForm,
  headcount,
  siret,
  cba,
  logoUrl,
}: {
  companyName: string;
  legalForm: string | null;
  headcount: string | null;
  siret: string | null;
  cba: string | null;
  logoUrl: string | null;
}) {
  const [message, formAction, pending] = useActionState(saveCompanyIdentity, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-muted">
        Logo de l&apos;entreprise
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL, pas un asset Next
            <img
              src={logoUrl}
              alt="Logo de l'entreprise"
              className="h-12 w-12 rounded-md border border-border object-contain"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted">
              Aucun logo
            </span>
          )}
          <input type="file" name="logo" accept="image/*" className="text-sm text-ink" />
        </div>
      </label>
      {logoUrl && <CheckboxField label="Retirer le logo actuel" name="remove_logo" />}

      <div className="flex flex-wrap gap-2">
        <TextField label="SIRET" name="siret" defaultValue={siret ?? ""} className="w-40" />
        <TextField
          label="Convention collective"
          name="cba"
          defaultValue={cba ?? ""}
          className="w-56"
        />
      </div>

      <TextField label="Raison sociale" name="company_name" defaultValue={companyName} required />
      <TextField label="Forme" name="legal_form" defaultValue={legalForm ?? ""} />
      <TextField label="Effectif global" name="headcount" defaultValue={headcount ?? ""} />

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
