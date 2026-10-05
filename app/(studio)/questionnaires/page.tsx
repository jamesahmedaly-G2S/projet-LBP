import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getQuestionTypeLabel } from "@/lib/studio/question-type";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { LinkButton } from "@/ui-kit/LinkButton";

interface QuestionRow {
  id: string;
  code: string;
  type: string;
  label: string;
  required: boolean;
  condition_question_code: string | null;
  condition_value: string | null;
  display_order: number;
}

// STU-QUEST-01 : liste ordonnée du questionnaire maître — une question
// conditionnelle affiche sa dépendance directement dans la liste, pas
// besoin d'ouvrir chaque question pour comprendre la structure.
export default async function QuestionnairesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("master_questions")
    .select(
      "id, code, type, label, required, condition_question_code, condition_value, display_order",
    )
    .order("display_order")
    .returns<QuestionRow[]>();

  const rows = questions ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-studio-navy">Questionnaire maître</h1>
        <LinkButton href="/questionnaires/nouvelle" variant="primary">
          + Nouvelle question
        </LinkButton>
      </div>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-studio-muted">Aucune question pour l&apos;instant.</p>
        </Card>
      ) : (
        <Card padded={false} className="mt-6">
          <ul className="divide-y divide-studio-line">
            {rows.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/questionnaires/${q.id}`}
                  className="flex items-start justify-between gap-3 px-5 py-3 text-sm hover:bg-studio-bg"
                >
                  <div>
                    <p className="text-studio-navy">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-studio-muted">
                      <span className="font-mono">{q.code}</span> · {getQuestionTypeLabel(q.type)}
                      {q.condition_question_code &&
                        ` · visible si ${q.condition_question_code} = ${q.condition_value}`}
                    </p>
                  </div>
                  <Badge tone="neutral">#{q.display_order}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
