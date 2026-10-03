import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseQuiz } from "@/lib/studio/parse-quiz";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  questions: string;
  master_themes: { name: string } | null;
  master_sheets: { title: string } | null;
}

// LBP-CLIENT-06 : le CRUD admin existe déjà côté Studio (STU-QUIZ-01/02/03)
// — seul l'écran de passage manquait. `quizzes_read_published` (RLS
// réelle, baseline_schema_reel.sql) ne laisse passer que published=true
// pour un rôle client, donc pas besoin de filtrer côté requête.
export default async function ClientQuizListPage() {
  const session = await requireClient();
  const supabase = await createClient();

  const [{ data: quizzes }, { data: scores }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, description, questions, master_themes(name), master_sheets(title)")
      .order("created_at", { ascending: false })
      .returns<QuizRow[]>(),
    supabase
      .from("quiz_scores")
      .select("quiz_id, score, taken_at")
      .eq("profile_id", session.userId)
      .not("quiz_id", "is", null)
      .order("taken_at", { ascending: false }),
  ]);

  const lastScoreByQuiz = new Map<string, number>();
  for (const s of scores ?? []) {
    if (!lastScoreByQuiz.has(s.quiz_id as string)) {
      lastScoreByQuiz.set(s.quiz_id as string, s.score as number);
    }
  }

  const rows = quizzes ?? [];

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Évaluation</Eyebrow>
      <SectionTitle>Testez vos connaissances</SectionTitle>
      <p className="-mt-3 text-sm text-muted">Les quizz de vos fiches, à faire directement ici.</p>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-muted">Aucun quiz disponible pour l&apos;instant.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((quiz) => {
            const attachedTo = quiz.master_themes?.name ?? quiz.master_sheets?.title ?? null;
            const nbQuestions = parseQuiz(quiz.questions).length;
            const lastScore = lastScoreByQuiz.get(quiz.id);
            return (
              <Card key={quiz.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/mes-quiz/${quiz.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {quiz.title}
                    </Link>
                    {quiz.description && (
                      <p className="mt-1 text-sm text-ink">{quiz.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {attachedTo && (
                        <>
                          Rattaché à <span className="italic">{attachedTo}</span> ·{" "}
                        </>
                      )}
                      {nbQuestions} question{nbQuestions > 1 ? "s" : ""}
                    </p>
                  </div>
                  {lastScore !== undefined && (
                    <Badge tone={lastScore >= 50 ? "green" : "amber"}>
                      {lastScore.toFixed(0)} %
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
