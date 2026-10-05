import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseQuiz } from "@/lib/studio/parse-quiz";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { LinkButton } from "@/ui-kit/LinkButton";

interface QuizRow {
  id: string;
  title: string;
  published: boolean;
  questions: string;
  master_themes: { name: string } | null;
  master_sheets: { title: string } | null;
}

// STU-QUIZ-03 : écran d'administration des quiz — onglet "Quiz &
// formations" (§3), jusqu'ici sans aucun écran.
export default async function QuizListPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, published, questions, master_themes(name), master_sheets(title)")
    .order("created_at", { ascending: false })
    .returns<QuizRow[]>();

  const rows = quizzes ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-studio-navy">Quiz &amp; formations</h1>
        <LinkButton href="/quiz/nouveau" variant="primary">
          + Nouveau quiz
        </LinkButton>
      </div>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-studio-muted">Aucun quiz pour l&apos;instant.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {rows.map((quiz) => {
            const attachedTo = quiz.master_themes?.name ?? quiz.master_sheets?.title ?? "—";
            const nbQuestions = parseQuiz(quiz.questions).length;
            return (
              <Card key={quiz.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/quiz/${quiz.id}`}
                      className="font-medium text-studio-blue hover:underline"
                    >
                      {quiz.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-studio-muted">
                      Rattaché à <span className="italic">{attachedTo}</span> · {nbQuestions}{" "}
                      question{nbQuestions > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge tone={quiz.published ? "green" : "neutral"}>
                    {quiz.published ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
