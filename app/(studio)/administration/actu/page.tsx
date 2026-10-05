import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import ArticlesManager, { type ArticleAdmin } from "./ArticlesManager";

export default async function AdminActuPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, type, title, category, subcategories, author, published_at, reading_time, image_url, pdf_url, content, published",
    )
    .order("published_at", { ascending: false })
    .returns<ArticleAdmin[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Actu · Décrypt RH&amp;Paie</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Les articles et dossiers affichés côté client (/actu). Un article non publié reste un
        brouillon, visible uniquement ici.
      </p>

      <Card className="mt-6">
        <ArticlesManager articles={articles ?? []} />
      </Card>
    </main>
  );
}
