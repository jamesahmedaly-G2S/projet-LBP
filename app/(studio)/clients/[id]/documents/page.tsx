import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import DocumentsManager from "./DocumentsManager";
import type { CompanyDocument } from "@/lib/client/company-documents";

// LBP-CLIENT-02 : écran admin de "Vos documents" (1.3.5), pendant de
// CcnSection.tsx sur la fiche client (app/(studio)/clients/[id]/page.tsx)
// -- même principe "le client demande, G2S contrôle" déjà appliqué à
// l'offre/aux fiches affectées.
export default async function ClientDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name")
    .eq("id", id)
    .single();
  if (!company) notFound();

  const { data: documents } = await supabase
    .from("company_documents")
    .select("id, category, name, meta, doc_date, url")
    .eq("company_id", id)
    .order("doc_date", { ascending: false })
    .returns<CompanyDocument[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">
        Vos documents — {company.company_name}
      </h1>
      <p className="mt-1 text-sm text-studio-muted">
        Conventions collectives, accords d&apos;entreprise, grille de salaire, autres documents. Le
        client consulte, sans pouvoir modifier.
      </p>

      <Card className="mt-6">
        <DocumentsManager companyId={company.id} documents={documents ?? []} />
      </Card>
    </main>
  );
}
