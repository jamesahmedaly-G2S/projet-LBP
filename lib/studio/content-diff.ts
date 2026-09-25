import type { SupabaseClient } from "@supabase/supabase-js";
import type { SheetContent } from "./placeholder-content";

export interface DiffSegment {
  text: string;
  changed: boolean;
}

/**
 * STU-WORKFLOW-05 : diff mot-à-mot (LCS classique) entre le texte publié
 * précédent et le texte publié actuel. Ne calcule QUE les segments du
 * texte courant — un passage supprimé n'apparaît nulle part, il n'y a
 * rien à surligner côté client pour du contenu qui a disparu. Découpage
 * en tokens "mot ou espace" pour reconstruire le texte exactement (join
 * de `text` sur tous les segments === `current`).
 */
export function diffText(previous: string, current: string): DiffSegment[] {
  const oldTokens = tokenize(previous);
  const newTokens = tokenize(current);

  // Table LCS classique (programmation dynamique) — les textes de fiches
  // font quelques dizaines de mots, O(n*m) est largement suffisant ici.
  const lcs: number[][] = Array.from({ length: oldTokens.length + 1 }, () =>
    new Array(newTokens.length + 1).fill(0),
  );
  for (let i = oldTokens.length - 1; i >= 0; i--) {
    for (let j = newTokens.length - 1; j >= 0; j--) {
      lcs[i][j] =
        oldTokens[i] === newTokens[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (j < newTokens.length) {
    if (
      i < oldTokens.length &&
      oldTokens[i] === newTokens[j] &&
      lcs[i][j] === lcs[i + 1][j + 1] + 1
    ) {
      pushSegment(segments, newTokens[j], false);
      i++;
      j++;
    } else if (i < oldTokens.length && lcs[i + 1][j] >= lcs[i][j + 1]) {
      // token supprimé côté ancien texte : n'apparaît pas dans le résultat
      i++;
    } else {
      pushSegment(segments, newTokens[j], true);
      j++;
    }
  }

  return segments;
}

function pushSegment(segments: DiffSegment[], text: string, changed: boolean) {
  const last = segments[segments.length - 1];
  if (last && last.changed === changed) {
    last.text += text;
  } else {
    segments.push({ text, changed });
  }
}

function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

export type ContentDiff = Record<keyof SheetContent, DiffSegment[]>;

export function diffSheetContent(previous: SheetContent, current: SheetContent): ContentDiff {
  return {
    essentiel: diffText(previous.essentiel, current.essentiel),
    comprendre: diffText(previous.comprendre, current.comprendre),
    maitriser: diffText(previous.maitriser, current.maitriser),
    application: diffText(previous.application, current.application),
    vigilance: diffText(previous.vigilance, current.vigilance),
  };
}

/**
 * Résout la version publiée courante et la version précédente (même
 * couche/clé, numéro juste inférieur) pour une fiche, puis calcule le
 * diff. Retourne `null` si la fiche n'a jamais été publiée deux fois — rien
 * à comparer, pas d'erreur (c'est le cas normal pour toute fiche publiée
 * une seule fois).
 */
export async function getPublishedContentDiff(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  masterSheetId: string,
  layerKind: string,
): Promise<ContentDiff | null> {
  const { data: current } = await supabase
    .from("sheet_versions")
    .select("version, content")
    .eq("master_sheet_id", masterSheetId)
    .eq("layer_kind", layerKind)
    .eq("status", "published")
    .maybeSingle();

  if (!current || current.version <= 1) {
    return null;
  }

  const { data: previous } = await supabase
    .from("sheet_versions")
    .select("content")
    .eq("master_sheet_id", masterSheetId)
    .eq("layer_kind", layerKind)
    .eq("version", current.version - 1)
    .maybeSingle();

  if (!previous) {
    return null;
  }

  return diffSheetContent(previous.content as SheetContent, current.content as SheetContent);
}
