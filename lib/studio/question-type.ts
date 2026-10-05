/**
 * Libellés du type de question (`question_type`, STU-DATA-03). Source
 * unique réutilisée par la liste et le formulaire (STU-QUEST-01/02).
 */
export type QuestionType = "ccn" | "select" | "bool" | "text";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  ccn: "Convention collective",
  select: "Choix dans une liste",
  bool: "Oui / Non",
  text: "Texte libre",
};

export function getQuestionTypeLabel(type: string): string {
  return QUESTION_TYPE_LABELS[type as QuestionType] ?? type;
}
