"use client";

import { useActionState, useState } from "react";
import { saveOfferContent } from "./actions";
import { TextField, TextAreaField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export interface StudioOfferContentAdmin {
  tier_level: number;
  name: string;
  sub: string;
  price: number;
  users: number;
  extra_user_price: number | null;
  badge: string;
  reco: boolean;
  promesse: string;
  sous_promesse: string | null;
  description: string;
  pourqui: string;
  inc: string[];
  why: string[];
  foot: string;
  cta: string;
  cta2: string;
  highlight: string | null;
  formula: string[] | null;
  blocs: [string, string][] | null;
  note: string | null;
}

// STU-OFFER-03 : les 4 paliers sont fixes (offer_tiers.tier_level, table
// réelle de James) -- un seul mode ici, éditer, jamais ajouter/supprimer.
export default function OffersManager({ offer }: { offer: StudioOfferContentAdmin }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-studio-navy">
            {offer.name}{" "}
            {offer.badge && <span className="text-xs text-studio-amber">({offer.badge})</span>}
          </p>
          <p className="text-sm text-studio-muted">
            {offer.price} € HT/an · jusqu&apos;à {offer.users} utilisateurs
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-studio-blue hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Fermer" : "Modifier"}
        </button>
      </div>

      {open && <OfferForm offer={offer} onDone={() => setOpen(false)} />}
    </div>
  );
}

const arrayToLines = (arr: string[] | null) => (arr ?? []).join("\n");
const blocsToLines = (blocs: [string, string][] | null) =>
  (blocs ?? []).map(([title, text]) => `${title}|${text}`).join("\n");

function OfferForm({ offer, onDone }: { offer: StudioOfferContentAdmin; onDone: () => void }) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveOfferContent(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border border-studio-line p-3"
    >
      <input type="hidden" name="tier_level" value={offer.tier_level} />

      <div className="flex flex-wrap gap-2">
        <TextField label="Nom" name="name" defaultValue={offer.name} required className="w-56" />
        <TextField
          label="Sous-titre"
          name="sub"
          defaultValue={offer.sub}
          required
          className="flex-1"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <TextField
          label="Prix annuel (€ HT)"
          name="price"
          type="number"
          defaultValue={offer.price}
          required
          className="w-32"
        />
        <TextField
          label="Utilisateurs inclus"
          name="users"
          type="number"
          defaultValue={offer.users}
          required
          className="w-32"
        />
        <TextField
          label="Prix / utilisateur suppl. (vide = sur devis)"
          name="extra_user_price"
          type="number"
          defaultValue={offer.extra_user_price ?? ""}
          className="w-56"
        />
        <TextField
          label="Badge (optionnel)"
          name="badge"
          defaultValue={offer.badge}
          className="w-48"
        />
        <CheckboxField label="Offre recommandée" name="reco" defaultChecked={offer.reco} />
      </div>

      <TextField label="Promesse" name="promesse" defaultValue={offer.promesse} required />
      <TextField
        label="Sous-promesse (optionnel)"
        name="sous_promesse"
        defaultValue={offer.sous_promesse ?? ""}
      />
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={offer.description}
        rows={3}
        required
      />
      <TextAreaField
        label="Pour qui ?"
        name="pourqui"
        rows={2}
        defaultValue={offer.pourqui}
        required
      />

      <TextAreaField
        label="Ce que vous obtenez (un par ligne)"
        name="inc"
        defaultValue={arrayToLines(offer.inc)}
        rows={6}
        required
      />
      <TextAreaField
        label="Pourquoi choisir cette offre (un par ligne)"
        name="why"
        defaultValue={arrayToLines(offer.why)}
        rows={3}
        required
      />

      <TextAreaField
        label="Note de bas de carte"
        name="foot"
        rows={2}
        defaultValue={offer.foot}
        required
      />

      <div className="flex flex-wrap gap-2">
        <TextField
          label="Bouton principal"
          name="cta"
          defaultValue={offer.cta}
          required
          className="w-56"
        />
        <TextField
          label="Bouton secondaire"
          name="cta2"
          defaultValue={offer.cta2}
          required
          className="w-56"
        />
      </div>

      <TextField
        label="Mise en avant (optionnel, ex. LOI + VOTRE CONVENTION COLLECTIVE)"
        name="highlight"
        defaultValue={offer.highlight ?? ""}
      />
      <TextField
        label="Formule (un mot par ligne, séparé par des virgules, optionnel)"
        name="formula"
        defaultValue={(offer.formula ?? []).join(", ")}
        placeholder="LOI, CONVENTION COLLECTIVE, ACCORDS & USAGES"
      />
      <TextAreaField
        label="Blocs (optionnel, format Titre|Texte, un par ligne)"
        name="blocs"
        defaultValue={blocsToLines(offer.blocs)}
        rows={4}
        placeholder="VOS RÈGLES|Accords, usages, décisions et spécificités internes."
      />
      <TextField
        label="Note de tarification (optionnel)"
        name="note"
        defaultValue={offer.note ?? ""}
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-studio-red">{error}</p>}
    </form>
  );
}
