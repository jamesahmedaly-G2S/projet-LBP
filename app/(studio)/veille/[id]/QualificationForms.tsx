"use client";

import { useActionState, useMemo, useState } from "react";
import { qualifyWithExistingSheet, qualifyWithNewSheet } from "../actions";
import { SelectField, TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

interface Option {
  id: string;
  name: string;
  parentId: string | null;
}

// STU-VEILLE-02 : les deux formulaires sont rendus ensemble, sans onglet ni
// bascule qui en cacherait un — critère d'acceptation explicite, aucune
// suggestion automatique unique.
export default function QualificationForms({
  legalMonitoringId,
  sheets,
  families,
  themes,
  subthemes,
  suggested,
}: {
  legalMonitoringId: string;
  sheets: { id: string; code: string; title: string }[];
  families: Option[];
  themes: Option[];
  subthemes: Option[];
  suggested?: { familyId: string; themeId: string; subthemeId?: string };
}) {
  return (
    <div className="flex flex-col gap-6">
      <ExistingSheetForm legalMonitoringId={legalMonitoringId} sheets={sheets} />
      <div className="border-t border-studio-line pt-6">
        <NewSheetForm
          legalMonitoringId={legalMonitoringId}
          families={families}
          themes={themes}
          subthemes={subthemes}
          suggested={suggested}
        />
      </div>
    </div>
  );
}

function ExistingSheetForm({
  legalMonitoringId,
  sheets,
}: {
  legalMonitoringId: string;
  sheets: { id: string; code: string; title: string }[];
}) {
  const [error, formAction, pending] = useActionState(qualifyWithExistingSheet, null);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-studio-navy">Rattacher à une fiche existante</p>
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="legal_monitoring_id" value={legalMonitoringId} />
        <div className="min-w-[260px] flex-1">
          <SelectField label="Fiche" name="master_sheet_id" required defaultValue="">
            <option value="" disabled>
              Choisir une fiche
            </option>
            {sheets.map((sheet) => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.title} ({sheet.code})
              </option>
            ))}
          </SelectField>
        </div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "Rattacher"}
        </Button>
      </form>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function NewSheetForm({
  legalMonitoringId,
  families,
  themes,
  subthemes,
  suggested,
}: {
  legalMonitoringId: string;
  families: Option[];
  themes: Option[];
  subthemes: Option[];
  suggested?: { familyId: string; themeId: string; subthemeId?: string };
}) {
  const [error, formAction, pending] = useActionState(qualifyWithNewSheet, null);
  const [familyId, setFamilyId] = useState(suggested?.familyId ?? families[0]?.id ?? "");
  const [themeId, setThemeId] = useState(suggested?.themeId ?? "");

  const themesOfFamily = useMemo(
    () => themes.filter((theme) => theme.parentId === familyId),
    [themes, familyId],
  );
  const subthemesOfTheme = useMemo(
    () => subthemes.filter((subtheme) => subtheme.parentId === themeId),
    [subthemes, themeId],
  );

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-studio-navy">Créer une nouvelle fiche</p>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="legal_monitoring_id" value={legalMonitoringId} />

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
          <SelectField
            label="Sous-thème (optionnel)"
            name="subtheme_id"
            defaultValue={suggested?.subthemeId ?? ""}
          >
            <option value="">Aucun</option>
            {subthemesOfTheme.map((subtheme) => (
              <option key={subtheme.id} value={subtheme.id}>
                {subtheme.name}
              </option>
            ))}
          </SelectField>
        )}

        <TextField label="Titre de la nouvelle fiche" name="title" required />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button type="submit" variant="secondary" disabled={pending} className="w-fit">
          {pending ? "..." : "Créer et rattacher"}
        </Button>
      </form>
    </div>
  );
}
