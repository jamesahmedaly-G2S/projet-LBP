import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { computeAnswerComparison, type AnswerHistoryRow } from "@/lib/studio/answer-comparison";
import { Card } from "@/ui-kit/Card";
import QuestionnaireForm, { type FormQuestion } from "./QuestionnaireForm";
import AnswerComparisonTable from "./AnswerComparisonTable";

// STU-QUEST-02/03 : accessible depuis la fiche client ("Ouvrir le
// questionnaire"), même point d'entrée que `stOpenQuest()` dans
// LBP_V6_Studio.html. Préremplit avec les dernières réponses
// (`company_current_answers`, STU-DATA-04). Avec `?entretien=<id>` (un
// `company_interviews` existant, créé par STU-INTERVIEW-01/02), affiche en
// plus la comparaison avant/pendant cet entretien.
export default async function CompanyQuestionnairePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ entretien?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { entretien: interviewId } = await searchParams;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name")
    .eq("id", id)
    .single();

  if (!company) {
    notFound();
  }

  const [{ data: questions }, { data: answers }, { data: history }] = await Promise.all([
    supabase
      .from("master_questions")
      .select("code, type, label, required, options, condition_question_code, condition_value")
      .neq("type", "ccn")
      .order("display_order")
      .returns<FormQuestion[]>(),
    supabase
      .from("company_current_answers")
      .select("question_code, answer_value")
      .eq("company_id", id),
    interviewId
      ? supabase
          .from("company_questionnaire_answers")
          .select("question_code, answer_value, answered_at, interview_id")
          .eq("company_id", id)
          .returns<AnswerHistoryRow[]>()
      : Promise.resolve({ data: null }),
  ]);

  const initialAnswers = Object.fromEntries(
    (answers ?? []).map((a) => [a.question_code, a.answer_value as string]),
  );

  const comparison = interviewId && history ? computeAnswerComparison(history, interviewId) : null;
  const labelByCode = Object.fromEntries((questions ?? []).map((q) => [q.code, q.label]));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/clients/${id}`} className="text-sm text-studio-blue hover:underline">
        ← Retour à la fiche client
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">
        Questionnaire — {company.company_name}
      </h1>
      <p className="mt-1 text-sm text-studio-muted">
        {interviewId
          ? "Entretien en cours — prérempli avec les dernières réponses."
          : "Prérempli avec les dernières réponses enregistrées."}
      </p>

      {comparison && (
        <div className="mt-6">
          <AnswerComparisonTable rows={comparison} labelByCode={labelByCode} />
        </div>
      )}

      <Card className="mt-6">
        <QuestionnaireForm
          companyId={company.id}
          interviewId={interviewId}
          questions={questions ?? []}
          initialAnswers={initialAnswers}
        />
      </Card>
    </main>
  );
}
