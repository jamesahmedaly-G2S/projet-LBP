import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseQuiz } from "@/lib/studio/parse-quiz";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "@/app/(client)/_components/Eyebrow";
import { SectionTitle } from "@/app/(client)/_components/SectionTitle";

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  questions: string;
  master_themes: { name: string } | null;
  master_sheets: { title: string } | null;
}

// STU-CLIENT-04 (étendu) : équivalent en lecture seule de
// app/(client)/mes-quiz/page.tsx -- liste uniquement, jamais le passage
// du quiz (QuizPlayer soumet un score via requireClient(), sans
// équivalent pour un admin qui n'a pas de company_id).
export default async function VueClientQuizPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id, title, description, questions, master_themes(name), master_sheets(title)")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .returns<QuizRow[]>();

  const rows = quizzes ?? [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
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
            return (
              <Card key={quiz.id}>
                <p className="font-medium text-ink">{quiz.title}</p>
                {quiz.description && <p className="mt-1 text-sm text-ink">{quiz.description}</p>}
                <p className="mt-1 text-xs text-muted">
                  {attachedTo && (
                    <>
                      Rattaché à <span className="italic">{attachedTo}</span> ·{" "}
                    </>
                  )}
                  {nbQuestions} question{nbQuestions > 1 ? "s" : ""}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
