"use client";

import { useMemo, useState } from "react";

export interface CcnOption {
  idcc: string;
  name: string;
}

// STU-CCN-01 : composant réutilisable de sélection multiple de CCN, avec
// recherche par nom ou IDCC (§7.2 du dossier). Piloté en tant que composant
// contrôlé (selected/onChange) pour rester réutilisable dans le
// questionnaire, l'assistant de création client et la fiche client.
export default function CcnMultiSelect({
  catalog,
  selected,
  onChange,
}: {
  catalog: CcnOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((ccn) => ccn.name.toLowerCase().includes(q) || ccn.idcc.includes(q));
  }, [catalog, query]);

  function toggle(idcc: string) {
    onChange(selected.includes(idcc) ? selected.filter((v) => v !== idcc) : [...selected, idcc]);
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        placeholder="Rechercher par nom ou IDCC..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="rounded border border-zinc-300 px-3 py-2 text-sm"
      />

      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded border border-zinc-200 p-2">
        {filtered.length === 0 && <li className="text-sm text-zinc-400">Aucun résultat.</li>}
        {filtered.map((ccn) => (
          <li key={ccn.idcc}>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={selected.includes(ccn.idcc)}
                onChange={() => toggle(ccn.idcc)}
              />
              <span className="font-mono text-xs text-zinc-500">{ccn.idcc}</span>
              {ccn.name}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
