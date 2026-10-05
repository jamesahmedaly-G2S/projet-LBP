import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import QuizForm from "../QuizForm";
import { updateQuiz } from "../actions";
import DeleteQuizButton from "./DeleteQuizButton";

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quiz }, { data: themes }, { data: sheets }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, description, questions, published, master_theme_id, master_sheet_id")
      .eq("id", id)
      .single(),
    supabase.from("master_themes").select("id, name").order("name"),
    supabase.from("master_sheets").select("id, code, title").order("title"),
  ]);

  if (!quiz) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/quiz" className="text-sm text-studio-blue hover:underline">
        ← Retour aux quiz
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-studio-navy">{quiz.title}</h1>
        <DeleteQuizButton quizId={quiz.id} />
      </div>
      <Card>
        <QuizForm
          action={updateQuiz}
          initial={{
            id: quiz.id,
            title: quiz.title,
            description: quiz.description ?? "",
            questions: quiz.questions,
            published: quiz.published,
            masterThemeId: quiz.master_theme_id,
            masterSheetId: quiz.master_sheet_id,
          }}
          themes={themes ?? []}
          sheets={sheets ?? []}
          submitLabel="Enregistrer"
        />
      </Card>
    </main>
  );
}
