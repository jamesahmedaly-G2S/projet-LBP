// LBP-CLIENT-13 : vocabulaire partagé de l'arbre de décision du chatbot
// -- admin (`app/(studio)/administration/chatbot/`) et client
// (`AssistanceButton.tsx`) consomment exactement les mêmes types, jamais
// deux définitions divergentes.
export interface ChatbotOption {
  id: string;
  question_id: string;
  label: string;
  sort_order: number;
  next_question_id: string | null;
  solution_text: string | null;
  is_escalation: boolean;
}

export interface ChatbotQuestion {
  id: string;
  prompt: string;
  is_root: boolean;
}

export interface ChatbotQuestionWithOptions extends ChatbotQuestion {
  options: ChatbotOption[];
}

// Une option n'a jamais qu'un seul type de résultat (contrainte CHECK en
// base, migration 20261006110000) -- ce helper évite de relire les 3
// colonnes à chaque point d'usage.
export type OptionOutcome =
  | { kind: "next_question"; questionId: string }
  | { kind: "solution"; text: string }
  | { kind: "escalation" };

export function optionOutcome(option: ChatbotOption): OptionOutcome {
  if (option.next_question_id)
    return { kind: "next_question", questionId: option.next_question_id };
  if (option.is_escalation) return { kind: "escalation" };
  return { kind: "solution", text: option.solution_text ?? "" };
}
