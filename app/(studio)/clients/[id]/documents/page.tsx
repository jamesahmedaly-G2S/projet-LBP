import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import DocumentsManager, { type DocumentWithPreview } from "./DocumentsManager";
import {
  COMPANY_DOCUMENTS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  type CompanyDocument,
} from "@/lib/client/company-documents";

// LBP-CLIENT-02 : écran admin de "Vos documents" (1.3.5), pendant de
// CcnSection.tsx sur la fiche client (app/(studio)/clients/[id]/page.tsx)
// -- même principe "le client demande, G2S contrôle" déjà appliqué à
// l'offre/aux fiches affectées.
//
// Correctif (05/10/2026), suite à la réponse de Pauline sur le stockage
// réel des PDF : les documents avec un `file_path` (bucket privé) n'ont
// pas d'URL utilisable telle quelle -- une URL signée à durée limitée
// est générée ici, côté serveur, avant d'atteindre le composant client.
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
    .select("id, category, name, meta, doc_date, url, file_path")
    .eq("company_id", id)
    .order("doc_date", { ascending: false })
    .returns<CompanyDocument[]>();

  const documentsWithPreview: DocumentWithPreview[] = await Promise.all(
    (documents ?? []).map(async (doc) => {
      if (!doc.file_path) return { ...doc, previewUrl: null };
      const { data: signed } = await supabase.storage
        .from(COMPANY_DOCUMENTS_BUCKET)
        .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS);
      return { ...doc, previewUrl: signed?.signedUrl ?? null };
    }),
  );

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
        <DocumentsManager companyId={company.id} documents={documentsWithPreview} />
      </Card>
    </main>
  );
}
