import { notFound } from "next/navigation";
import Link from "next/link";
import { File, Search } from "lucide-react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "../../../_components/Eyebrow";
import { SectionTitle } from "../../../_components/SectionTitle";
import {
  DOCUMENT_CATEGORY_INTROS,
  documentCategoryLabel,
  groupDocumentsByYear,
  isDocumentCategory,
  COMPANY_DOCUMENTS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  type CompanyDocument,
} from "@/lib/client/company-documents";

// LBP-CLIENT-02 : détail d'une catégorie de "Vos documents", port de
// `renderDocDetail()` (`LBP_V9.9_Studio.html` ~L10280-10313) -- classé
// par année décroissante, lien "Consulter en ligne ↗" quand une URL est
// renseignée, "Aucun fichier joint" sinon. Lecture seule : aucun bouton
// d'ajout/modification/suppression ici, contrairement au mode admin du
// prototype (`g` truthy) -- "le client consulte, sans pouvoir modifier"
// (~L10309).
//
// Correctif (05/10/2026), suite à la réponse de Pauline ("pour les
// accords et autres il nous faut [du vrai stockage]") : un document peut
// maintenant pointer vers un vrai PDF dans le bucket privé
// `company-documents` (`file_path`) plutôt qu'un simple lien externe --
// une URL signée à durée limitée est générée ici pour chacun, jamais un
// chemin de stockage exposé tel quel au navigateur.
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
    .select("id, category, name, meta, doc_date, url, file_path")
    .eq("company_id", companyId)
    .eq("category", category)
    .returns<CompanyDocument[]>();

  const docsWithPreview = await Promise.all(
    (documents ?? []).map(async (doc) => {
      if (!doc.file_path) return { ...doc, previewUrl: null as string | null };
      const { data: signed } = await supabase.storage
        .from(COMPANY_DOCUMENTS_BUCKET)
        .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS);
      return { ...doc, previewUrl: signed?.signedUrl ?? null };
    }),
  );

  const years = groupDocumentsByYear(docsWithPreview);

  // Passe fidélité mesurée (06/10/2026, getComputedStyle sur #v-docdetail) :
  // retour = `.btn-line.back` texte 13px 700 framboise, padding 4px 0,
  // mb 16px ; intro 13.5px --ink-soft, mb 14px (directement sous le titre,
  // pas remontée) ; `.doc-year` mb 20px, `.doc-year-h` 17px 800 avec filet
  // bas 2px #F5F0EC, pb 5px, mb 9px ; `.doc-row` flex gap 12px, blanc,
  // filet #DED9DB, rayon 12px, padding 12px 15px, mb 8px, ombre
  // --shadow-sm, pastille d'icône 40px (`search` si lien en ligne, `file`
  // sinon, 18px) ; `.dname` 14px 700 ; `.dmeta` 11.5px --ink-soft, date
  // longue ("30 juin 2025", formatActuDate) ; bouton `.btn-line.btn-xs`.
  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Link
        href="/mon-entreprise"
        className="mb-4 inline-flex items-center gap-[7px] rounded-full py-1 text-[13px] font-bold text-primary hover:underline"
      >
        ← Retour à Mon entreprise
      </Link>
      <Eyebrow>Vos documents</Eyebrow>
      <SectionTitle>{documentCategoryLabel(category)}</SectionTitle>
      <p className="mb-[14px] text-[13.5px] leading-[1.5] text-[#6B656B]">
        {DOCUMENT_CATEGORY_INTROS[category]}
      </p>

      {years.length === 0 ? (
        <p className="text-sm text-[#6B656B]">Aucun document dans cette catégorie.</p>
      ) : (
        <div>
          {years.map(([year, docs]) => (
            <div key={year} className="mb-5">
              <h3 className="mb-[9px] border-b-2 border-[#F5F0EC] pb-[5px] text-[17px] leading-[1.5] font-extrabold text-ink">
                {year}
              </h3>
              <ul>
                {docs.map((doc) => {
                  const href = doc.url ?? doc.previewUrl;
                  const Icon = doc.url ? Search : File;
                  return (
                    <li
                      key={doc.id}
                      className="mb-2 flex items-center gap-3 rounded-xl border border-[#DED9DB] bg-white px-[15px] py-3 shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] text-ink">
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm leading-[1.5] font-bold text-ink">{doc.name}</div>
                        <div className="mt-0.5 text-[11.5px] leading-[1.5] text-[#6B656B]">
                          {[
                            doc.meta,
                            doc.doc_date
                              ? new Date(doc.doc_date).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg border border-primary bg-white px-[11px] py-[5px] text-xs font-bold whitespace-nowrap text-primary transition-colors hover:bg-primary hover:text-white"
                        >
                          {doc.url ? "Consulter en ligne ↗" : "Ouvrir le document"}
                        </a>
                      ) : (
                        <span className="mt-0.5 shrink-0 text-[11.5px] leading-[1.5] text-[#6B656B]">
                          Aucun fichier joint
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
