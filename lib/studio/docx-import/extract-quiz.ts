import type { ParsedDocxBlock } from "./parse-docx";

/**
 * STU-IMPORT-05 : extraction du quiz depuis les blocs de la section "quiz"
 * (STU-IMPORT-01) vers le format `.qz` déjà consommé par `parseQuiz()`
 * (lib/studio/parse-quiz.ts) -- jamais un nouveau format de stockage.
 *
 * Port 1:1 de la branche `sec==='quiz'` de `wordAnalyseElements()`
 * (LBP_V9.9_Studio.html, L.5313-5326) : options préfixées "A./B./C./D./E.",
 * réponse correcte annoncée par une ligne "Bonne réponse : X", explication
 * par une ligne "Explication : ...". Le prototype gère aussi le
 * découpage d'une question par sous-titre Word (une question = un
 * Heading2/3) -- non porté ici : STU-IMPORT-01 ne modélise pas de
 * sous-titres imbriqués dans une section, seul le repli explicitement
 * prévu par le prototype ("les questions peuvent être de simples
 * paragraphes numérotés") est implémenté. Dette connue si un vrai document
 * utilise des sous-titres par question -- à revoir avec les fiches
 * étalons réelles (STU-IMPORT-04) quand elles seront transmises.
 */
export interface ExtractedQuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explication: string;
}

export interface ExtractQuizResult {
  questions: ExtractedQuizQuestion[];
  /** Lignes qui n'ont pu être rattachées à aucune question -- jamais perdues silencieusement (§7.2). */
  unrecognized: string[];
}

function blockText(b: ParsedDocxBlock): string {
  if (b.type === "table") return "";
  return b.text;
}

export function extractQuizFromBlocks(blocks: ParsedDocxBlock[]): ExtractQuizResult {
  const questions: ExtractedQuizQuestion[] = [];
  const unrecognized: string[] = [];
  let curq: ExtractedQuizQuestion | null = null;

  for (const block of blocks) {
    const t = blockText(block).trim();
    if (!t) continue;

    const optionMatch = t.match(/^([A-E])[.)]\s*(.+)$/);
    if (optionMatch && curq) {
      curq.options.push(optionMatch[2].trim());
      continue;
    }

    const correctMatch = t.match(/^bonne\s+r(?:é|e)ponse\s*:?\s*([A-E])\b[.)]?\s*(.*)$/i);
    if (correctMatch && curq) {
      curq.correct = "ABCDE".indexOf(correctMatch[1].toUpperCase());
      if (correctMatch[2] && !curq.explication) curq.explication = correctMatch[2].trim();
      continue;
    }

    const explicationMatch = t.match(/^explication\s*:?\s*(.+)$/i);
    if (explicationMatch && curq) {
      curq.explication = curq.explication
        ? `${curq.explication} ${explicationMatch[1].trim()}`
        : explicationMatch[1].trim();
      continue;
    }

    const numberedMatch = t.match(/^\d+[.)]\s*(.+)$/);
    if (numberedMatch) {
      curq = { q: numberedMatch[1].trim(), options: [], correct: -1, explication: "" };
      questions.push(curq);
      continue;
    }

    if (curq && curq.explication) {
      curq.explication += ` ${t}`;
      continue;
    }
    if (curq && curq.options.length === 0) {
      curq.q += ` ${t}`;
      continue;
    }
    unrecognized.push(t);
  }

  return { questions, unrecognized };
}

/** Sérialise vers le format texte `.qz` de parseQuiz() (lib/studio/parse-quiz.ts). */
export function quizToQzFormat(questions: ExtractedQuizQuestion[]): string {
  return questions
    .map((q) => {
      const lines = [q.q];
      q.options.forEach((opt, i) => {
        lines.push(i === q.correct ? `-* ${opt}` : `- ${opt}`);
      });
      if (q.explication) lines.push(`> ${q.explication}`);
      return lines.join("\n");
    })
    .join("\n\n");
}
