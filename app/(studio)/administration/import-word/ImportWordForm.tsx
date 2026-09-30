"use client";

import { useActionState, useMemo, useState } from "react";
import { parseUploadedDocx, validateAndCreateSheet, type ParsePreviewResult } from "./actions";
import CcnResolutionPanel, { type CcnResolution } from "./CcnResolutionPanel";
import type { ParsedDocxBlock, SheetSectionField } from "@/lib/studio/docx-import/parse-docx";
import { extractQuizFromBlocks, quizToQzFormat } from "@/lib/studio/docx-import/extract-quiz";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";
import { SelectField } from "@/ui-kit/Field";

interface Option {
  id: string;
  name: string;
  parentId: string | null;
}

const SECTION_LABELS: Record<SheetSectionField, string> = {
  essentiel: "L'essentiel à retenir",
  comprendre: "Comprendre la règle",
  maitriser: "Maîtriser la règle dans le détail",
  application: "Application concrète en paie",
  vigilance: "Points de vigilance",
  quiz: "Quiz",
  annexe: "Annexe interne G2S (jamais visible côté client)",
};

const CONTENT_FIELDS: Exclude<SheetSectionField, "quiz">[] = [
  "essentiel",
  "comprendre",
  "maitriser",
  "application",
  "vigilance",
];

const initialState: ParsePreviewResult = {
  error: null,
  parsed: null,
  ccnMatches: null,
  ccnCatalog: null,
};

function blockToText(b: {
  type: string;
  text?: string;
  table?: { headers: string[]; rows: string[][] };
}): string {
  if (b.type === "table" && b.table) {
    return [b.table.headers.join(" | "), ...b.table.rows.map((r) => r.join(" | "))].join("\n");
  }
  return b.type === "list-item" ? `- ${b.text}` : (b.text ?? "");
}

export default function ImportWordForm({
  families,
  themes,
  subthemes,
}: {
  families: Option[];
  themes: Option[];
  subthemes: Option[];
}) {
  const [state, formAction, pending] = useActionState(parseUploadedDocx, initialState);
  const [sectionOverrides, setSectionOverrides] = useState<
    Record<number, SheetSectionField | "ignore">
  >({});
  const [ccnResolutions, setCcnResolutions] = useState<Record<string, CcnResolution>>({});
  const [familyId, setFamilyId] = useState("");
  const [themeId, setThemeId] = useState("");
  const [subthemeId, setSubthemeId] = useState("");
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [createdSheetId, setCreatedSheetId] = useState<string | null>(null);

  const themesOfFamily = useMemo(
    () => themes.filter((t) => t.parentId === familyId),
    [themes, familyId],
  );
  const subthemesOfTheme = useMemo(
    () => subthemes.filter((s) => s.parentId === themeId),
    [subthemes, themeId],
  );

  const fieldFor = (sectionIndex: number, autoField: SheetSectionField | null) =>
    sectionOverrides[sectionIndex] ?? autoField ?? "ignore";

  const quizBlocks: ParsedDocxBlock[] = useMemo(() => {
    if (!state.parsed) return [];
    const blocks: ParsedDocxBlock[] = [];
    state.parsed.sections.forEach((s, i) => {
      if (fieldFor(i, s.field) === "quiz") blocks.push(...s.blocks);
    });
    return blocks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.parsed, sectionOverrides]);

  const quizExtraction = useMemo(() => extractQuizFromBlocks(quizBlocks), [quizBlocks]);

  async function handleValidate() {
    if (!state.parsed) return;
    setValidating(true);
    setValidateError(null);

    const content = {
      essentiel: "",
      comprendre: "",
      maitriser: "",
      application: "",
      vigilance: "",
    };
    let annexeText = "";
    state.parsed.sections.forEach((s, i) => {
      const field = fieldFor(i, s.field);
      if (field === "ignore" || field === "quiz") return;
      const text = s.blocks.map(blockToText).join("\n");
      if (field === "annexe") {
        annexeText = annexeText ? `${annexeText}\n\n${text}` : text;
        return;
      }
      content[field] = content[field] ? `${content[field]}\n\n${text}` : text;
    });

    const ccnLayerIdccs = (state.ccnMatches ?? [])
      .map((m) => {
        if (m.matched) return m.matched.idcc;
        const resolution = ccnResolutions[m.normalizedIdcc];
        if (!resolution) return null;
        if (resolution.kind === "create") return m.normalizedIdcc;
        if (resolution.kind === "associate") return resolution.idcc;
        return null;
      })
      .filter((idcc): idcc is string => idcc !== null);

    const result = await validateAndCreateSheet({
      numeroFiche: state.parsed.numeroFiche ?? "",
      titre: state.parsed.titre ?? "",
      familyId,
      themeId,
      subthemeId: subthemeId || null,
      content,
      ccnLayerIdccs,
      internalAnnexe: annexeText || null,
      quizQz: quizExtraction.questions.length > 0 ? quizToQzFormat(quizExtraction.questions) : null,
    });

    setValidating(false);
    if (result.error) setValidateError(result.error);
    else setCreatedSheetId(result.sheetId);
  }

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium text-studio-muted">
          Fichier .docx
          <input
            type="file"
            name="file"
            accept=".docx"
            required
            className="text-sm text-studio-navy"
          />
        </label>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Analyse..." : "Analyser"}
        </Button>
      </form>

      {state.error && <p className="mt-3 text-sm text-studio-red">{state.error}</p>}

      {state.parsed && !createdSheetId && (
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-studio-muted">Fiche détectée</p>
            <p className="text-sm text-studio-navy">
              {state.parsed.numeroFiche ? (
                <>
                  <b>{state.parsed.numeroFiche}</b> — {state.parsed.titre}
                </>
              ) : (
                <>
                  Aucun numéro de fiche détecté (attendu : &laquo;&nbsp;NN.NN — Titre&nbsp;&raquo;)
                  — titre lu : {state.parsed.titre ?? "—"}
                </>
              )}
            </p>
          </div>

          <div className="rounded-md border border-studio-line p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-studio-muted">
              Rattachement (obligatoire avant validation)
            </p>
            <div className="flex flex-wrap gap-2">
              <SelectField
                label="Famille"
                value={familyId}
                onChange={(e) => {
                  setFamilyId(e.target.value);
                  setThemeId("");
                  setSubthemeId("");
                }}
                className="w-56"
              >
                <option value="">— Choisir —</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Thème"
                value={themeId}
                onChange={(e) => {
                  setThemeId(e.target.value);
                  setSubthemeId("");
                }}
                className="w-56"
                disabled={!familyId}
              >
                <option value="">— Choisir —</option>
                {themesOfFamily.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </SelectField>
              {subthemesOfTheme.length > 0 && (
                <SelectField
                  label="Sous-thème (optionnel)"
                  value={subthemeId}
                  onChange={(e) => setSubthemeId(e.target.value)}
                  className="w-56"
                >
                  <option value="">Aucun</option>
                  {subthemesOfTheme.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </SelectField>
              )}
            </div>
          </div>

          <CcnResolutionPanel
            matches={state.ccnMatches ?? []}
            catalog={state.ccnCatalog ?? []}
            resolutions={ccnResolutions}
            onResolve={(idcc, resolution) =>
              setCcnResolutions((r) => ({ ...r, [idcc]: resolution }))
            }
          />

          <div>
            <p className="text-xs uppercase tracking-wide text-studio-muted">
              Sections détectées ({state.parsed.sections.length})
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {state.parsed.sections.map((s, i) => (
                <div key={i} className="rounded-md border border-studio-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-studio-navy">{s.headingText}</p>
                    {s.field ? (
                      <Badge tone="blue">{SECTION_LABELS[s.field]}</Badge>
                    ) : (
                      <Badge tone="amber">Rubrique non reconnue</Badge>
                    )}
                    <SelectField
                      label="Rattacher à"
                      value={fieldFor(i, s.field)}
                      onChange={(e) =>
                        setSectionOverrides((o) => ({
                          ...o,
                          [i]: e.target.value as SheetSectionField | "ignore",
                        }))
                      }
                      className="w-56"
                    >
                      <option value="ignore">Ignorer (ne pas importer)</option>
                      {CONTENT_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {SECTION_LABELS[f]}
                        </option>
                      ))}
                      <option value="quiz">{SECTION_LABELS.quiz}</option>
                      <option value="annexe">{SECTION_LABELS.annexe}</option>
                    </SelectField>
                  </div>
                  <p className="mt-1 text-xs text-studio-muted">
                    {s.blocks.length} bloc(s) — {s.blocks.filter((b) => b.type === "table").length}{" "}
                    tableau(x), {s.blocks.filter((b) => b.type === "list-item").length} élément(s)
                    de liste
                  </p>
                  {s.blocks.slice(0, 2).map((b, bi) =>
                    b.type === "table" ? (
                      <p key={bi} className="mt-1 text-xs text-studio-muted italic">
                        Tableau : {b.table.headers.join(" | ")} ({b.table.rows.length} ligne(s))
                      </p>
                    ) : (
                      <p key={bi} className="mt-1 truncate text-xs text-studio-muted">
                        {b.type === "list-item" ? "• " : ""}
                        {b.text}
                      </p>
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>

          {quizBlocks.length > 0 && (
            <div className="rounded-md border border-studio-line p-3">
              <p className="text-xs uppercase tracking-wide text-studio-muted">
                Quiz extrait ({quizExtraction.questions.length} question(s))
              </p>
              {quizExtraction.questions.map((q, i) => (
                <div key={i} className="mt-2 text-sm text-studio-navy">
                  <p className="font-medium">
                    {i + 1}. {q.q}
                  </p>
                  <ul className="ml-4 list-disc text-xs text-studio-muted">
                    {q.options.map((opt, oi) => (
                      <li
                        key={oi}
                        className={oi === q.correct ? "font-semibold text-studio-green" : ""}
                      >
                        {opt} {oi === q.correct && "(bonne réponse)"}
                      </li>
                    ))}
                  </ul>
                  {q.explication && (
                    <p className="ml-4 text-xs italic text-studio-muted">{q.explication}</p>
                  )}
                </div>
              ))}
              {quizExtraction.unrecognized.length > 0 && (
                <div className="mt-2 rounded-md bg-studio-amber-bg p-2">
                  <p className="text-xs font-medium text-studio-amber">
                    {quizExtraction.unrecognized.length} ligne(s) non reconnue(s) dans le quiz :
                  </p>
                  {quizExtraction.unrecognized.map((line, i) => (
                    <p key={i} className="text-xs text-studio-muted">
                      « {line} »
                    </p>
                  ))}
                </div>
              )}
              {quizExtraction.questions.length === 0 && (
                <p className="mt-1 text-xs text-studio-muted">
                  Aucune question reconnue (format attendu : &laquo;&nbsp;1. Question&nbsp;&raquo;,
                  options &laquo;&nbsp;A./B./...&nbsp;&raquo;, &laquo;&nbsp;Bonne réponse :
                  X&nbsp;&raquo;, &laquo;&nbsp;Explication : ...&nbsp;&raquo;).
                </p>
              )}
            </div>
          )}

          <div className="rounded-md border border-studio-line bg-studio-bg p-3">
            <p className="text-xs text-studio-muted">
              Aucune écriture en base n&apos;a encore eu lieu. La validation crée la fiche, sa
              version régime général, une couche par CCN reconnue/créée/associée, l&apos;annexe
              interne (si rattachée) et le quiz (si des questions ont été reconnues).
            </p>
            <Button
              type="button"
              variant="primary"
              className="mt-2"
              disabled={validating || !state.parsed.numeroFiche || !familyId || !themeId}
              onClick={handleValidate}
            >
              {validating ? "Création..." : "Valider et créer la fiche"}
            </Button>
            {validateError && <p className="mt-2 text-sm text-studio-red">{validateError}</p>}
          </div>
        </div>
      )}

      {createdSheetId && (
        <div className="mt-6 rounded-md border border-studio-green bg-studio-green-bg p-3">
          <p className="text-sm text-studio-navy">
            Fiche créée avec succès.{" "}
            <a href={`/referentiel/${createdSheetId}`} className="text-studio-blue hover:underline">
              Voir la fiche →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
