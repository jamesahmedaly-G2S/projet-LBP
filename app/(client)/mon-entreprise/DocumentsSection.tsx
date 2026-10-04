import Link from "next/link";
import { DOCUMENT_CATEGORIES, type CompanyDocument } from "@/lib/client/company-documents";

// LBP-CLIENT-02 : "Vos documents" (1.3.5), port de `renderDocs()`
// (`LBP_V9.9_Studio.html` ~L10250-10261) -- 4 cartes de catégorie avec
// icône/nom/compte, chacune ouvrant le détail de sa catégorie
// (`openDocCat()` → `/mon-entreprise/documents/[category]` ici, pas un
// `goView()` JS). Lecture seule : le client consulte, jamais n'ajoute/
// modifie/supprime (`renderDocDetail()` ~L10309 : "Le client consulte,
// sans pouvoir modifier").
export default function DocumentsSection({ documents }: { documents: CompanyDocument[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DOCUMENT_CATEGORIES.map((cat) => {
        const count = documents.filter((d) => d.category === cat.key).length;
        return (
          <Link
            key={cat.key}
            href={`/mon-entreprise/documents/${cat.key}`}
            className="flex flex-col items-start gap-1.5 rounded-lg border border-border bg-white px-4 py-3.5 text-left transition-colors hover:border-primary"
          >
            <span className="text-xl">{cat.icon}</span>
            <span className="text-sm font-semibold text-ink">{cat.label}</span>
            <span className="text-xs text-muted">
              {count} document{count > 1 ? "s" : ""} →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
