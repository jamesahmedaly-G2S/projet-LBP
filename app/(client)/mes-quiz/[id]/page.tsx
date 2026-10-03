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
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Link href="/mes-quiz" className="text-sm text-primary hover:underline">
        ← Retour aux quiz
      </Link>

      <div className="mt-4">
        <QuizPlayer quizId={quiz.id} title={quiz.title} questions={questions} />
      </div>
    </main>
  );
}
