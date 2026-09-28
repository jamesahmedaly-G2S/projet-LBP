export interface QuizOption {
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  q: string;
  opts: QuizOption[];
  expl: string;
}

/**
 * Port 1:1 de `parseQuiz()` (`LBP_V6_Studio.html`) — désigné par
 * `docs/ARCHITECTURE.md` §10 comme devant être "porté tel quel avec ses
 * tests" (aucun test formel n'existait encore dans ce projet — vérifié via
 * exécution réelle contre le vrai format `.qz`, même pratique que
 * `lib/studio/content-diff.ts`, STU-WORKFLOW-05).
 *
 * Format texte : blocs séparés par une ligne vide, dans chaque bloc une
 * ligne `-` = option, `-*` = bonne réponse, `>` = explication (STU-QUIZ-02),
 * toute autre ligne = énoncé de la question.
 */
export function parseQuiz(text: string | null | undefined): QuizQuestion[] {
  if (!text) return [];

  // Un <textarea> soumis via un vrai <form> HTML normalise les retours à
  // la ligne en CRLF (constaté en réel : \r\n\r\n casse la séparation par
  // ligne vide, /\n{2,}/ n'y voit plus deux \n consécutifs) — normalisé
  // ici une bonne fois, jamais supposé côté appelant.
  const normalized = text.replace(/\r\n?/g, "\n");
  const blocks = normalized.split(/\n{2,}/);
  const out: QuizQuestion[] = [];

  for (const block of blocks) {
    const lines = block
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length);
    if (!lines.length) continue;

    const qp: string[] = [];
    const opts: QuizOption[] = [];
    let expl = "";

    for (const l of lines) {
      if (l.charAt(0) === ">") {
        expl = l.replace(/^>\s*/, "");
      } else if (l.charAt(0) === "-") {
        let o = l.replace(/^-\s*/, "");
        let correct = false;
        if (o.charAt(0) === "*") {
          correct = true;
          o = o.replace(/^\*\s*/, "");
        }
        opts.push({ text: o, correct });
      } else {
        qp.push(l);
      }
    }

    if (qp.length && opts.length) {
      out.push({ q: qp.join(" "), opts, expl });
    }
  }

  return out;
}
