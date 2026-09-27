import { normText } from "@/lib/search/normalize";

export interface ThemeOption {
  id: string;
  name: string;
  parentId: string | null;
}

export interface VeilleSuggestion {
  familyId: string;
  themeId: string;
  themeName: string;
  subthemeId?: string;
  subthemeName?: string;
}

const MIN_WORD_LENGTH = 5;

function significantWords(text: string): string[] {
  return normText(text)
    .split(/\s+/)
    .filter((word) => word.length >= MIN_WORD_LENGTH);
}

function overlapScore(words: Set<string>, candidateName: string): number {
  return significantWords(candidateName).filter((word) => words.has(word)).length;
}

/**
 * STU-VEILLE-02 (correctif) : port de `veilleSuggest()` (`LBP_V6_Studio.html`
 * — présent aussi dans la version précédente `LBP_V2-20.html`, donc déjà
 * attendu au moment où STU-VEILLE-02 a été construit). Compare les mots
 * significatifs (>= 5 caractères, comme l'original) de l'intitulé/résumé de
 * l'entrée de veille à ceux de chaque thème/sous-thème réel — jamais un
 * score de 0, comme dans l'original (`bestScore>=1`). Aucune IA ici : un
 * simple recoupement de mots, exécuté côté serveur avant même de proposer
 * la qualification.
 *
 * Écart volontaire par rapport au prototype : celui-ci ne compare qu'aux
 * sous-thèmes, en tenant pour acquis qu'ils existent tous. Dans nos
 * données réelles, `master_subthemes` est vide (référentiel complet non
 * seedé, cf. STU-REF-04/STU-QUEST-01) — comparer uniquement aux sous-thèmes
 * rendrait la suggestion morte tant que personne ne les a saisis. Compare
 * donc aussi aux thèmes eux-mêmes, à égalité de méthode ; un match plus
 * précis au niveau sous-thème l'emporte naturellement dès qu'il obtient un
 * meilleur score.
 */
export function suggestTheme(
  text: string,
  themes: ThemeOption[],
  subthemes: ThemeOption[],
): VeilleSuggestion | null {
  const words = new Set(significantWords(text));
  if (words.size === 0) return null;

  let best: VeilleSuggestion | null = null;
  let bestScore = 0;

  for (const theme of themes) {
    if (!theme.parentId) continue;
    const score = overlapScore(words, theme.name);
    if (score > bestScore) {
      bestScore = score;
      best = { familyId: theme.parentId, themeId: theme.id, themeName: theme.name };
    }
  }

  for (const subtheme of subthemes) {
    const theme = themes.find((t) => t.id === subtheme.parentId);
    if (!theme || !theme.parentId) continue;

    const score = overlapScore(words, subtheme.name);
    if (score > bestScore) {
      bestScore = score;
      best = {
        familyId: theme.parentId,
        themeId: theme.id,
        themeName: theme.name,
        subthemeId: subtheme.id,
        subthemeName: subtheme.name,
      };
    }
  }

  return bestScore >= 1 ? best : null;
}
