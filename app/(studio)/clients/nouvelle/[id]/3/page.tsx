import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWizardCompany, WZ_STEPS } from "@/lib/studio/wizard-steps";
import { Card } from "@/ui-kit/Card";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import WizardNav from "@/app/(studio)/_components/WizardNav";
import CcnSection from "@/app/(studio)/clients/[id]/CcnSection";
import QuestionnaireForm, {
  type FormQuestion,
} from "@/app/(studio)/clients/[id]/questionnaire/QuestionnaireForm";

// STU-CLIENT-01 (étape 3 — Questionnaire & CCN). Réutilise tel quel
// CcnSection (STU-CCN-02) et QuestionnaireForm (STU-QUEST-02) — même
// composants que la fiche client, comme prévu explicitement par ces deux
// tickets ("sera réutilisé tel quel par STU-CLIENT-01"). Chacun a son
// propre bouton d'enregistrement (architecture serveur, pas de state
// wizard unique côté client comme le prototype) : "Continuer" ne fait que
// naviguer, il ne réenregistre rien.
export default async function QuestionnaireEtCcnStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const company = await getWizardCompany(supabase, id);

  const [{ data: catalog }, { data: companyCcns }, { data: questions }, { data: answers }] =
    await Promise.all([
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
    ]);

  const initialAnswers = Object.fromEntries(
    (answers ?? []).map((a) => [a.question_code, a.answer_value as string]),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={3} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-studio-navy">
          Étape 3 — Conventions collectives
        </h2>
        <CcnSection
          companyId={id}
          catalog={catalog ?? []}
          initialSelected={(companyCcns ?? []).map((row) => row.ccn_idcc)}
        />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-studio-navy">Étape 3 — Questionnaire</h2>
        <QuestionnaireForm
          companyId={id}
          questions={questions ?? []}
          initialAnswers={initialAnswers}
        />
      </Card>

      <WizardNav backHref={`/clients/nouvelle/${id}/2`} nextHref={`/clients/nouvelle/${id}/4`} />
    </main>
  );
}
