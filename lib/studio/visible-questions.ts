/**
 * STU-QUEST-01/02 : reproduit `visibleQuestions(answers)` de
 * `LBP_V6_Studio.html` (racine de `LBP_V2/`) — une question conditionnelle
 * n'apparaît que si la réponse à sa question-condition correspond
 * exactement à la valeur attendue. Fonction pure, réutilisée par le
 * formulaire de saisie (STU-QUEST-02) et, plus tard, tout écran qui
 * affiche le questionnaire (résumé client, entretien).
 */
export interface VisibleQuestionShape {
  code: string;
  condition_question_code: string | null;
  condition_value: string | null;
}

export function getVisibleQuestions<T extends VisibleQuestionShape>(
  questions: T[],
  answers: Record<string, string>,
): T[] {
  return questions.filter((q) => {
    if (!q.condition_question_code) return true;
    return answers[q.condition_question_code] === q.condition_value;
  });
}
