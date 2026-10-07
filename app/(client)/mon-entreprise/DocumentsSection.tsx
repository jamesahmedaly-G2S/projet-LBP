import Link from "next/link";
import { Book, ChartLine, File, SquarePen, type LucideIcon } from "lucide-react";
import { DOCUMENT_CATEGORIES, type CompanyDocument } from "@/lib/client/company-documents";

// LBP-CLIENT-02 : "Vos documents" (1.3.5), port de `renderDocs()`
// (`LBP_V9.9_Studio.html` ~L10250-10261) -- 4 cartes de catégorie avec
// icône/nom/compte, chacune ouvrant le détail de sa catégorie
// (`openDocCat()` → `/mon-entreprise/documents/[category]` ici, pas un
// `goView()` JS). Lecture seule : le client consulte, jamais n'ajoute/
// modifie/supprime (`renderDocDetail()` ~L10309 : "Le client consulte,
// sans pouvoir modifier").
// Passe fidélité mesurée (06/10/2026) : `.docs-grid` 4 colonnes gap 14px ;
// `.doc-subcard` blanc, filet #DED9DB, rayon 14px, padding 16px 18px,
// ombre --shadow-sm, survol translateY(-2px) ; icône = vrai SVG
// `ico(book|edit|chart|file, 22)` carbone (pas l'emoji de
// DOCUMENT_CATEGORIES), mb 8px ; `.ds-n` 14px/17.5px 800 ; `.ds-c` 12px
// 700 --ink-soft, mt 3px.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cc: Book,
  acc: SquarePen,
  grille: ChartLine,
  charte: File,
};

export default function DocumentsSection({ documents }: { documents: CompanyDocument[] }) {
  return (
    <div className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
      {DOCUMENT_CATEGORIES.map((cat) => {
        const count = documents.filter((d) => d.category === cat.key).length;
        const Icon = CATEGORY_ICONS[cat.key] ?? File;
        return (
          <Link
            key={cat.key}
            href={`/mon-entreprise/documents/${cat.key}`}
            className="block rounded-[14px] border border-[#DED9DB] bg-white px-[18px] py-4 text-left shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(68,80,104,0.28)]"
          >
            <span className="mb-2 block leading-none text-ink">
              <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
            </span>
            <span className="block text-sm leading-[1.25] font-extrabold text-ink">
              {cat.label}
            </span>
            <span className="mt-[3px] block text-xs font-bold text-[#6B656B]">
              {count} document{count > 1 ? "s" : ""} →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
