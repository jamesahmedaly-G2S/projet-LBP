"use client";

import { useState, useTransition } from "react";
import CcnMultiSelect, { type CcnOption } from "../../_components/CcnMultiSelect";
import { updateCompanyCcns } from "../actions";

export default function CcnSection({
  companyId,
  catalog,
  initialSelected,
}: {
  companyId: string;
  catalog: CcnOption[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState(initialSelected);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save() {
    startTransition(async () => {
      const error = await updateCompanyCcns(companyId, selected);
      setMessage(error ?? "Enregistré.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <CcnMultiSelect catalog={catalog} selected={selected} onChange={setSelected} />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="w-fit rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer les CCN"}
      </button>
      {message && <p className="text-sm text-zinc-600">{message}</p>}
    </div>
  );
}
