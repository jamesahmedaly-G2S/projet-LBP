"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveCcn } from "../ccn/actions";
import type { CcnCatalogEntry, CcnMatch } from "@/lib/studio/docx-import/match-ccn";
import { Badge } from "@/ui-kit/Badge";
import { Button } from "@/ui-kit/Button";
import { TextField, SelectField } from "@/ui-kit/Field";

export type CcnResolution =
  { kind: "create" } | { kind: "associate"; idcc: string } | { kind: "ignore" };

// STU-IMPORT-02/03 : écran de résolution à 3 choix (créer/associer/ignorer)
// pour une CCN détectée sans correspondance dans ccn_catalog (§6.4 : "Un
// IDCC inconnu ne doit jamais créer automatiquement une convention").
// "Créer" a un effet réel et durable (réutilise saveCcn(), jamais une
// deuxième implémentation) ; "Associer"/"Ignorer" ne résolvent l'ambiguïté
// qu'à l'écran -- `resolutions` remonte au parent (ImportWordForm) pour
// que la validation finale (STU-IMPORT-03) sache quelles couches CCN
// créer et lesquelles ignorer.
export default function CcnResolutionPanel({
  matches,
  catalog,
  resolutions,
  onResolve,
}: {
  matches: CcnMatch[];
  catalog: CcnCatalogEntry[];
  resolutions: Record<string, CcnResolution>;
  onResolve: (normalizedIdcc: string, resolution: CcnResolution) => void;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-studio-muted">
        Conventions collectives détectées ({matches.length})
      </p>
      {matches.length === 0 ? (
        <p className="text-sm text-studio-muted">Aucune mention IDCC trouvée.</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-2 text-sm">
          {matches.map((m) => (
            <li key={m.normalizedIdcc} className="rounded-md border border-studio-line p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-studio-navy">{m.raw}</span>
                <span className="text-xs text-studio-muted">
                  (IDCC normalisé <b>{m.normalizedIdcc}</b>)
                </span>
                {m.matched ? (
                  <Badge tone="green">Reconnue : {m.matched.name}</Badge>
                ) : resolutions[m.normalizedIdcc] ? (
                  <Badge tone="blue">
                    {resolutions[m.normalizedIdcc].kind === "create" && "Sera créée"}
                    {resolutions[m.normalizedIdcc].kind === "associate" &&
                      `Associée à ${catalog.find((c) => c.idcc === (resolutions[m.normalizedIdcc] as { kind: "associate"; idcc: string }).idcc)?.name ?? ""}`}
                    {resolutions[m.normalizedIdcc].kind === "ignore" && "Ignorée pour le moment"}
                  </Badge>
                ) : (
                  <Badge tone="amber">Aucune CCN correspondante</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-studio-muted">
                Sous : {m.headingContexts.join(" · ")}
              </p>

              {!m.matched && !resolutions[m.normalizedIdcc] && (
                <UnknownCcnResolver
                  normalizedIdcc={m.normalizedIdcc}
                  catalog={catalog}
                  onCreated={() => onResolve(m.normalizedIdcc, { kind: "create" })}
                  onAssociated={(idcc) => onResolve(m.normalizedIdcc, { kind: "associate", idcc })}
                  onIgnored={() => onResolve(m.normalizedIdcc, { kind: "ignore" })}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UnknownCcnResolver({
  normalizedIdcc,
  catalog,
  onCreated,
  onAssociated,
  onIgnored,
}: {
  normalizedIdcc: string;
  catalog: CcnCatalogEntry[];
  onCreated: () => void;
  onAssociated: (idcc: string) => void;
  onIgnored: () => void;
}) {
  const [mode, setMode] = useState<"none" | "create" | "associate">("none");
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveCcn(prev, fd);
    if (!result) onCreated();
    return result;
  }, null);

  if (mode === "create") {
    return (
      <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2">
        <input type="hidden" name="idcc" value={normalizedIdcc} />
        <TextField
          label="IDCC"
          name="idcc_display"
          defaultValue={normalizedIdcc}
          readOnly
          disabled
          className="w-24 bg-studio-bg"
        />
        <TextField label="Nom de la convention" name="name" required className="w-64" />
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Créer"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setMode("none")}>
          Annuler
        </Button>
        {error && <p className="w-full text-xs text-studio-red">{error}</p>}
      </form>
    );
  }

  if (mode === "associate") {
    return (
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <SelectField
          label="Associer à"
          name="associate_idcc"
          className="w-64"
          onChange={(e) => {
            if (e.target.value) onAssociated(e.target.value);
          }}
        >
          <option value="">— Choisir une convention —</option>
          {catalog.map((c) => (
            <option key={c.idcc} value={c.idcc}>
              {c.name} (IDCC {c.idcc})
            </option>
          ))}
        </SelectField>
        <Button type="button" variant="ghost" onClick={() => setMode("none")}>
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => setMode("create")}>
        Créer cette CCN
      </Button>
      <Button type="button" variant="secondary" onClick={() => setMode("associate")}>
        Associer à une CCN existante
      </Button>
      <Button type="button" variant="ghost" onClick={onIgnored}>
        Ignorer pour le moment
      </Button>
    </div>
  );
}
