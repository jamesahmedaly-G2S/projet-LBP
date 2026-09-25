"use client";

import { useActionState, useMemo, useState } from "react";
import { createMasterSheet } from "../actions";
import { SelectField, TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

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
    <form action={formAction} className="flex flex-col gap-4">
      <SelectField
        label="Famille"
        name="family_id"
        value={familyId}
        onChange={(e) => {
          setFamilyId(e.target.value);
          setThemeId("");
        }}
      >
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Thème"
        name="theme_id"
        value={themeId}
        onChange={(e) => setThemeId(e.target.value)}
        required
      >
        <option value="" disabled>
          Choisir un thème
        </option>
        {themesOfFamily.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </SelectField>

      {subthemesOfTheme.length > 0 && (
        <SelectField label="Sous-thème (optionnel)" name="subtheme_id" defaultValue="">
          <option value="">Aucun</option>
          {subthemesOfTheme.map((subtheme) => (
            <option key={subtheme.id} value={subtheme.id}>
              {subtheme.name}
            </option>
          ))}
        </SelectField>
      )}

      <TextField label="Titre" name="title" required />
      <TextField label="Tags (séparés par des virgules)" name="tags" />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" disabled={pending} className="mt-1 w-fit">
        {pending ? "Création..." : "Créer la fiche"}
      </Button>
    </form>
  );
}
