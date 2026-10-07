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
      {/* .back (LBP_V9.9_Studio.html ~L1151-1152, règle qui prime sur
          celle ~L178 : 13px, carbone, 700, souligné au survol seulement)
          -- texte exact de startQuizModule(). */}
      <Link
        href="/mes-quiz"
        className="mb-2 inline-block py-1 text-[13px] font-bold text-ink hover:underline"
      >
        ← Retour à la liste des quizz
      </Link>

      <QuizPlayer quizId={quiz.id} title={quiz.title} questions={questions} />
    </main>
  );
}
