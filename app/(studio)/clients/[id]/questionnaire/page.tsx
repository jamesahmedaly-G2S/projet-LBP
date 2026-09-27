import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import QuestionnaireForm, { type FormQuestion } from "./QuestionnaireForm";

// STU-QUEST-02 : accessible depuis la fiche client ("Ouvrir le
// questionnaire"), même point d'entrée que `stOpenQuest()` dans
// LBP_V6_Studio.html. Préremplit avec les dernières réponses
// (`company_current_answers`, STU-DATA-04).
export default async function CompanyQuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name")
    .eq("id", id)
    .single();

  if (!company) {
    notFound();
  }

  const [{ data: questions }, { data: answers }] = await Promise.all([
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
  ]);

  const initialAnswers = Object.fromEntries(
    (answers ?? []).map((a) => [a.question_code, a.answer_value as string]),
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/clients/${id}`} className="text-sm text-blue-700 hover:underline">
        ← Retour à la fiche client
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
        Questionnaire — {company.company_name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Prérempli avec les dernières réponses enregistrées.
      </p>

      <Card className="mt-6">
        <QuestionnaireForm
          companyId={company.id}
          questions={questions ?? []}
          initialAnswers={initialAnswers}
        />
      </Card>
    </main>
  );
}
