import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import EditQuestionForm from "./EditQuestionForm";
import ImpactsSection from "./ImpactsSection";
import DeleteQuestionButton from "./DeleteQuestionButton";

interface ImpactRow {
  id: string;
  answer_value: string;
  master_sheets: { id: string; code: string; title: string } | null;
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: question } = await supabase
    .from("master_questions")
    .select(
      "id, code, type, label, required, options, condition_question_code, condition_value, display_order",
    )
    .eq("id", id)
    .single();

  if (!question) {
    notFound();
  }

  const [{ data: otherQuestions }, { data: impacts }, { data: sheets }] = await Promise.all([
    supabase.from("master_questions").select("code, label").neq("id", id).order("display_order"),
    supabase
      .from("master_question_impacts")
      .select("id, answer_value, master_sheets(id, code, title)")
      .eq("question_code", question.code)
      .returns<ImpactRow[]>(),
    supabase.from("master_sheets").select("id, code, title").order("title"),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-studio-navy">{question.label}</h1>
        <DeleteQuestionButton questionId={question.id} />
      </div>
      <p className="mt-1 text-sm text-studio-muted">
        Identifiant stable : <span className="font-mono">{question.code}</span> (ne change jamais)
      </p>

      <Card className="mt-6">
        <EditQuestionForm
          question={question}
          existingQuestions={(otherQuestions ?? []).map((q) => ({ code: q.code, label: q.label }))}
        />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-studio-muted">
          Fiches déclenchées par une réponse — &quot;master_question_impacts&quot;
        </h2>
        <ImpactsSection
          questionId={question.id}
          questionCode={question.code}
          impacts={(impacts ?? []).map((i) => ({
            id: i.id,
            answerValue: i.answer_value,
            sheetTitle: i.master_sheets?.title ?? "(fiche introuvable)",
            sheetCode: i.master_sheets?.code ?? "?",
          }))}
          sheets={sheets ?? []}
        />
      </Card>
    </main>
  );
}
