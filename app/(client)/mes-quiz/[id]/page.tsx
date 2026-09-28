import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseQuiz } from "@/lib/studio/parse-quiz";
import QuizPlayer from "./QuizPlayer";

export default async function ClientQuizPage({ params }: { params: Promise<{ id: string }> }) {
  await requireClient();
  const { id } = await params;
  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, questions")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (!quiz) notFound();

  const questions = parseQuiz(quiz.questions);
  if (questions.length === 0) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/mes-quiz" className="text-sm text-primary hover:underline">
        ← Retour aux quiz
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-ink">{quiz.title}</h1>

      <div className="mt-6">
        <QuizPlayer quizId={quiz.id} questions={questions} />
      </div>
    </main>
  );
}
