import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { computeAnswerComparison, type AnswerHistoryRow } from "@/lib/studio/answer-comparison";
import CcnSection from "@/app/(studio)/clients/[id]/CcnSection";
import QuestionnaireForm, {
  type FormQuestion,
} from "@/app/(studio)/clients/[id]/questionnaire/QuestionnaireForm";
import AnswerComparisonTable from "@/app/(studio)/clients/[id]/questionnaire/AnswerComparisonTable";
import CompleteInterviewButton from "./CompleteInterviewButton";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

// STU-INTERVIEW-02 : scénario D complet — CCN (STU-CCN-02), questionnaire
// préempli + comparaison avant/pendant (STU-QUEST-02/03, réutilisés tels
// quels, exactement comme ces tickets l'annonçaient), impacts calculés en
// comparant l'instantané pris au démarrage (`before_sheet_ids`) à la vraie
// vue d'affectation relue en direct, puis validation G2S explicite qui
// termine l'entretien (`completeInterview`).
export default async function EntretienPage({
  params,
}: {
  params: Promise<{ id: string; interviewId: string }>;
}) {
  await requireAdmin();
  const { id, interviewId } = await params;
  const supabase = await createClient();

  const [{ data: company }, { data: interview }] = await Promise.all([
    supabase.from("companies").select("id, company_name").eq("id", id).single(),
    supabase
      .from("company_interviews")
      .select("id, company_id, status, before_sheet_ids")
      .eq("id", interviewId)
      .eq("company_id", id)
      .single(),
  ]);

  if (!company || !interview) {
    notFound();
  }
  if (interview.status === "done") {
    notFound();
  }

  const [
    { data: catalog },
    { data: companyCcns },
    { data: questions },
    { data: answers },
    { data: history },
    affectations,
  ] = await Promise.all([
    supabase.from("ccn_catalog").select("idcc, name").order("name"),
    supabase.from("company_ccns").select("ccn_idcc").eq("company_id", id),
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
    supabase
      .from("company_questionnaire_answers")
      .select("question_code, answer_value, answered_at, interview_id")
      .eq("company_id", id)
      .returns<AnswerHistoryRow[]>(),
    getCompanyAffectations(supabase, id),
  ]);

  const initialAnswers = Object.fromEntries(
    (answers ?? []).map((a) => [a.question_code, a.answer_value as string]),
  );
  const comparison = history ? computeAnswerComparison(history, interviewId) : null;
  const labelByCode = Object.fromEntries((questions ?? []).map((q) => [q.code, q.label]));

  const beforeIds = new Set((interview.before_sheet_ids as string[] | null) ?? []);
  const currentIds = new Set(
    affectations.filter((a) => !a.removedManually).map((a) => a.masterSheetId),
  );
  const added = affectations.filter(
    (a) => currentIds.has(a.masterSheetId) && !beforeIds.has(a.masterSheetId),
  );
  const removed = affectations.filter(
    (a) => beforeIds.has(a.masterSheetId) && !currentIds.has(a.masterSheetId),
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/clients/${id}`} className="text-sm text-studio-blue hover:underline">
        ← Retour à la fiche client
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-studio-navy">
          Entretien annuel — {company.company_name}
        </h1>
        <Badge tone="amber">En cours</Badge>
      </div>
      <p className="mt-1 text-sm text-studio-muted">
        Questionnaire préempli avec les dernières réponses. Confirmez ou modifiez chaque
        information.
      </p>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Conventions collectives</h2>
        <CcnSection
          companyId={id}
          catalog={catalog ?? []}
          initialSelected={(companyCcns ?? []).map((row) => row.ccn_idcc)}
        />
      </Card>

      {comparison && (
        <div className="mt-6">
          <AnswerComparisonTable rows={comparison} labelByCode={labelByCode} />
        </div>
      )}

      <Card className="mt-6">
        <QuestionnaireForm
          companyId={id}
          interviewId={interviewId}
          questions={questions ?? []}
          initialAnswers={initialAnswers}
        />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Différences et impacts</h2>
        {added.length === 0 && removed.length === 0 ? (
          <p className="text-sm text-studio-muted">Aucune modification pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {added.map((a) => (
              <li key={a.masterSheetId} className="flex items-center justify-between">
                <span className="text-studio-navy">{a.title}</span>
                <Badge tone="green">Nouvelle fiche à affecter</Badge>
              </li>
            ))}
            {removed.map((a) => (
              <li key={a.masterSheetId} className="flex items-center justify-between">
                <span className="text-studio-navy">{a.title}</span>
                <Badge tone="red">Devenue non applicable</Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-studio-line pt-4">
          <CompleteInterviewButton companyId={id} interviewId={interviewId} />
        </div>
      </Card>
    </main>
  );
}
