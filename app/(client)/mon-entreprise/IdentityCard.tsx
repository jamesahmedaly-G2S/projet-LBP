"use client";

import { useActionState, useState } from "react";
import { saveCompanyIdentity } from "./actions";
import { TextField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Modal } from "@/ui-kit/Modal";
import EstablishmentsSection from "./EstablishmentsSection";

interface Establishment {
  id: string;
  name: string;
  address: string | null;
}

interface IdentityProps {
  companyName: string;
  legalForm: string | null;
  headcount: string | null;
  siret: string | null;
  cba: string | null;
  logoUrl: string | null;
}

// Correctif (04/10/2026), suite au retour de l'utilisateur ("le contenu
// et la longueur à l'intérieur ça ne match pas avec la v9") : l'ancien
// `IdentityForm.tsx` affichait un formulaire en permanence déployé --
// le vrai `identCard` (`renderDocs()`, `LBP_V9.9_Studio.html`
// ~L10230-10235) est une carte d'affichage **compacte** en lecture
// seule (`.ent-head`/`.id-row`/`.id-lbl`/`.id-etabs`), avec un bouton
// crayon (`.mod-edit`, ~L723) qui ouvre un vrai modal d'édition
// (`#identEditor`, ~L12261-12274) -- jamais un champ de saisie visible
// en permanence sur le tableau de bord. Rebâti pour matcher ce format :
// carte compacte ici, formulaire déplacé dans un `Modal` (nouveau
// `ui-kit/Modal.tsx`).
export default function IdentityCard({
  identity,
  establishments,
}: {
  identity: IdentityProps;
  establishments: Establishment[];
}) {
  const [editing, setEditing] = useState(false);
  const { companyName, legalForm, headcount, siret, cba, logoUrl } = identity;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Modifier l'identité"
        className="absolute top-0 right-0 rounded-full p-1.5 text-base text-muted opacity-75 hover:bg-surface hover:opacity-100"
      >
        ✏️
      </button>

      <div className="flex items-center gap-3.5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, pas un asset Next
          <img
            src={logoUrl}
            alt="Logo de l'entreprise"
            className="h-16 w-16 shrink-0 rounded-xl border border-border bg-white object-contain p-1"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-border bg-surface text-center text-[9px] text-muted">
            <span>📄</span>
            <span>Aucun logo</span>
          </span>
        )}
        <div>
          <div className="text-base font-extrabold text-ink">{companyName}</div>
          {cba && <div className="text-sm text-muted">{cba}</div>}
        </div>
      </div>

      <dl className="mt-3 flex flex-col text-[13.5px]">
        {siret && (
          <div className="flex items-center justify-between gap-3.5 border-b border-border py-2">
            <dt className="text-muted">SIRET</dt>
            <dd className="font-bold text-ink">{siret}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3.5 border-b border-border py-2">
          <dt className="text-muted">Forme</dt>
          <dd className="font-bold text-ink">{legalForm || "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3.5 py-2">
          <dt className="text-muted">Effectif global</dt>
          <dd className="font-bold text-ink">{headcount || "—"}</dd>
        </div>
      </dl>

      <div className="mt-3 mb-2 text-[11px] font-extrabold tracking-[0.04em] text-muted uppercase">
        Établissements ({establishments.length})
      </div>
      <div className="flex flex-col gap-2">
        {establishments.length === 0 ? (
          <p className="text-sm text-muted">Aucun établissement renseigné.</p>
        ) : (
          establishments.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-2.5 rounded-[10px] bg-surface px-3 py-2.5 text-[13px]"
            >
              <span aria-hidden="true">🏢</span>
              <div>
                <b className="font-bold text-ink">{e.name}</b>
                {e.address && <div className="text-[11.5px] text-muted">{e.address}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Identité de l'entreprise">
        <IdentityForm identity={identity} onDone={() => setEditing(false)} />
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-sm font-medium text-muted">Établissements</p>
          <EstablishmentsSection establishments={establishments} />
        </div>
      </Modal>
    </div>
  );
}

function IdentityForm({ identity, onDone }: { identity: IdentityProps; onDone: () => void }) {
  const { companyName, legalForm, headcount, siret, cba, logoUrl } = identity;
  const [message, formAction, pending] = useActionState(
    async (prev: string | null, fd: FormData) => {
      const result = await saveCompanyIdentity(prev, fd);
      if (result === "Enregistré.") onDone();
      return result;
    },
    null,
  );

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
        {message && message !== "Enregistré." && <p className="text-xs text-danger">{message}</p>}
      </div>
    </form>
  );
}
