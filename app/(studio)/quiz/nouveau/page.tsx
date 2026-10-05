import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import QuizForm from "../QuizForm";
import { createQuiz } from "../actions";

export default async function NewQuizPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: themes }, { data: sheets }] = await Promise.all([
    supabase.from("master_themes").select("id, name").order("name"),
    supabase.from("master_sheets").select("id, code, title").order("title"),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-studio-navy">Nouveau quiz</h1>
      <Card>
        <QuizForm
          action={createQuiz}
          initial={{
            title: "",
            description: "",
            questions: "",
            published: false,
            masterThemeId: null,
            masterSheetId: null,
          }}
          themes={themes ?? []}
          sheets={sheets ?? []}
          submitLabel="Créer"
        />
      </Card>
    </main>
  );
}
