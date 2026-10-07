import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import ChatbotManager from "./ChatbotManager";
import type { ChatbotQuestionWithOptions } from "@/lib/client/chatbot";

// LBP-CLIENT-13 : administration de l'arbre de décision du chatbot
// d'assistance -- lien depuis /administration ("Données de référence"),
// même emplacement que Chiffres Paie/Dictionnaire/CCN/Calendrier RH.
export default async function ChatbotAdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: questions }, { data: options }] = await Promise.all([
    supabase.from("chatbot_questions").select("id, prompt, is_root").order("created_at"),
    supabase
      .from("chatbot_options")
      .select("id, question_id, label, sort_order, next_question_id, solution_text, is_escalation")
      .order("sort_order"),
  ]);

  const questionsWithOptions: ChatbotQuestionWithOptions[] = (questions ?? []).map((q) => ({
    ...q,
    options: (options ?? []).filter((o) => o.question_id === q.id),
  }));
  // La question racine en premier, suivi des autres dans leur ordre de
  // création -- repère visuel immédiat du point d'entrée de l'arbre.
  questionsWithOptions.sort((a, b) => Number(b.is_root) - Number(a.is_root));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">Chatbot d&apos;assistance</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Arbre de décision : une question racine, des choix qui affinent vers une autre question,
        concluent par une réponse, ou escaladent vers votre automatisation n8n.
      </p>

      <Card className="mt-6">
        <ChatbotManager questions={questionsWithOptions} />
      </Card>
    </main>
  );
}
