import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import NewQuestionForm from "./NewQuestionForm";

export default async function NouvelleQuestionPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("master_questions")
    .select("code, label")
    .order("display_order");

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-studio-navy">Nouvelle question</h1>
      <Card>
        <NewQuestionForm existingQuestions={questions ?? []} />
      </Card>
    </main>
  );
}
