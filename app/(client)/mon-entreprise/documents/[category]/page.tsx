import { notFound } from "next/navigation";
import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "../../../_components/Eyebrow";
import { SectionTitle } from "../../../_components/SectionTitle";
import {
  DOCUMENT_CATEGORY_INTROS,
  documentCategoryLabel,
  groupDocumentsByYear,
  isDocumentCategory,
  type CompanyDocument,
} from "@/lib/client/company-documents";

// LBP-CLIENT-02 : détail d'une catégorie de "Vos documents", port de
// `renderDocDetail()` (`LBP_V9.9_Studio.html` ~L10280-10313) -- classé
// par année décroissante, lien "Consulter en ligne ↗" quand une URL est
// renseignée, "Aucun fichier joint" sinon (pas de vraie infrastructure
// d'upload, même convention que `articles.pdf_url`). Lecture seule :
// aucun bouton d'ajout/modification/suppression ici, contrairement au
// mode admin du prototype (`g` truthy) -- "le client consulte, sans
// pouvoir modifier" (~L10309).
export default async function DocumentCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const session = await requireClient();
  const { category } = await params;
  if (!isDocumentCategory(category)) notFound();

  const companyId = session.profile.company_id;
  if (!companyId) {
    return (
      <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
        <p className="text-sm text-danger">
          Aucune société rattachée à ce compte — contactez votre référent G2S.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("company_documents")
    .select("id, category, name, meta, doc_date, url")
    .eq("company_id", companyId)
    .eq("category", category)
    .returns<CompanyDocument[]>();

  const years = groupDocumentsByYear(documents ?? []);

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Link
        href="/mon-entreprise"
        className="mb-4 inline-block text-sm text-primary hover:underline"
      >
        ← Retour à Mon entreprise
      </Link>
      <Eyebrow>Vos documents</Eyebrow>
      <SectionTitle>{documentCategoryLabel(category)}</SectionTitle>
      <p className="-mt-3 text-sm text-muted">{DOCUMENT_CATEGORY_INTROS[category]}</p>

      {years.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aucun document dans cette catégorie.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {years.map(([year, docs]) => (
            <div key={year}>
              <h3 className="mb-2 text-sm font-semibold text-ink">{year}</h3>
              <ul className="flex flex-col gap-2">
                {docs.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-ink">{doc.name}</div>
                      <div className="text-xs text-muted">
                        {[
                          doc.meta,
                          doc.doc_date ? new Date(doc.doc_date).toLocaleDateString("fr-FR") : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft"
                      >
                        Consulter en ligne ↗
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-muted">Aucun fichier joint</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
