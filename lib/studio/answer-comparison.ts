/**
 * STU-QUEST-03 : compare les réponses d'avant-entretien à celles saisies
 * pendant l'entretien en cours. `company_questionnaire_answers` est un
 * historique pur (aucun update en place, STU-DATA-04) : "avant" et
 * "pendant" se distinguent uniquement par `interview_id` — jamais par une
 * date arbitraire, pour rester correct même si l'entretien s'étale sur
 * plusieurs jours ou si on y revient après coup.
 */
export interface AnswerHistoryRow {
  question_code: string;
  answer_value: string;
  answered_at: string;
  interview_id: string | null;
}

export interface AnswerComparisonRow {
  questionCode: string;
  before: string | null;
  after: string | null;
  /** true seulement si une réponse a été saisie pendant CET entretien et
   * qu'elle diffère de la valeur d'avant — jamais vrai pour une question
   * simplement reconfirmée à l'identique. */
  changed: boolean;
}

export function computeAnswerComparison(
  history: AnswerHistoryRow[],
  interviewId: string,
): AnswerComparisonRow[] {
  const beforeByCode = new Map<string, AnswerHistoryRow>();
  const afterByCode = new Map<string, AnswerHistoryRow>();

  for (const row of history) {
    const bucket = row.interview_id === interviewId ? afterByCode : beforeByCode;
    const existing = bucket.get(row.question_code);
    if (!existing || row.answered_at > existing.answered_at) {
      bucket.set(row.question_code, row);
    }
  }

  const codes = new Set([...beforeByCode.keys(), ...afterByCode.keys()]);

  return Array.from(codes).map((code) => {
    const before = beforeByCode.get(code)?.answer_value ?? null;
    const afterRow = afterByCode.get(code);
    return {
      questionCode: code,
      before,
      after: afterRow ? afterRow.answer_value : before,
      changed: afterRow != null && afterRow.answer_value !== before,
    };
  });
}
