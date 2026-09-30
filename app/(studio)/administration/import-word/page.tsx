import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { Card } from "@/ui-kit/Card";
import ImportWordForm from "./ImportWordForm";

export default async function ImportWordPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Import Word</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Lecture native d&apos;un fichier .docx (STU-IMPORT-01) — aperçu du mapping détecté. Aucune
        écriture en base à ce stade : le contrôle et la validation (STU-IMPORT-03) restent à
        construire.
      </p>

      <Card className="mt-6">
        <ImportWordForm />
      </Card>
    </main>
  );
}
