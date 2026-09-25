"use client";

import { useActionState, useMemo, useState } from "react";
import { createMasterSheet } from "../actions";

interface Option {
  id: string;
  name: string;
  parentId: string | null;
}

export default function NewSheetForm({
  families,
  themes,
  subthemes,
}: {
  families: Option[];
  themes: Option[];
  subthemes: Option[];
}) {
  const [error, formAction, pending] = useActionState(createMasterSheet, null);
  const [familyId, setFamilyId] = useState(families[0]?.id ?? "");
  const [themeId, setThemeId] = useState("");

  const themesOfFamily = useMemo(
    () => themes.filter((theme) => theme.parentId === familyId),
    [themes, familyId],
  );
  const subthemesOfTheme = useMemo(
    () => subthemes.filter((subtheme) => subtheme.parentId === themeId),
    [subthemes, themeId],
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Famille
        <select
          name="family_id"
          value={familyId}
          onChange={(e) => {
            setFamilyId(e.target.value);
            setThemeId("");
          }}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {families.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Thème
        <select
          name="theme_id"
          value={themeId}
          onChange={(e) => setThemeId(e.target.value)}
          required
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Choisir un thème
          </option>
          {themesOfFamily.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>

      {subthemesOfTheme.length > 0 && (
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Sous-thème (optionnel)
          <select
            name="subtheme_id"
            defaultValue=""
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Aucun</option>
            {subthemesOfTheme.map((subtheme) => (
              <option key={subtheme.id} value={subtheme.id}>
                {subtheme.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Titre
        <input name="title" required className="rounded border border-zinc-300 px-3 py-2 text-sm" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        Tags (séparés par des virgules)
        <input name="tags" className="rounded border border-zinc-300 px-3 py-2 text-sm" />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer la fiche"}
      </button>
    </form>
  );
}
