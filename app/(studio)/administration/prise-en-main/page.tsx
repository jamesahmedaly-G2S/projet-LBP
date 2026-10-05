import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import HelpSettingsForm from "./HelpSettingsForm";

export default async function AdminPriseEnMainPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("help_page_settings")
    .select("title, points, video_title, video_text, video_url")
    .eq("id", 1)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Prise en main</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Contenu de la page d&apos;aide du LBP Client.
      </p>

      <Card className="mt-6">
        <HelpSettingsForm settings={settings!} />
      </Card>
    </main>
  );
}
