"use client";

import { useState, useTransition } from "react";
import CcnMultiSelect, { type CcnOption } from "../../_components/CcnMultiSelect";
import { updateCompanyCcns } from "../actions";
import { Button } from "@/ui-kit/Button";

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
      <Button type="button" variant="primary" onClick={save} disabled={pending} className="w-fit">
        {pending ? "Enregistrement..." : "Enregistrer les CCN"}
      </Button>
      {message && <p className="text-sm text-studio-muted">{message}</p>}
    </div>
  );
}
