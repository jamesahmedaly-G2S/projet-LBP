// LBP-CLIENT-02 : "Vos documents" (1.3.5) -- métadonnées des 4
// catégories réelles portées 1:1 depuis `renderDocs()`/`renderDocDetail()`
// (`LBP_V9.9_Studio.html` ~L10250, ~L10284-10288). Source unique,
// partagée entre l'écran admin (CRUD) et l'écran client (lecture seule)
// -- jamais dupliquée entre les deux, même discipline que
// `offer-tiers.ts`/`key-figure-labels.ts`.
export const DOCUMENT_CATEGORIES = [
  { key: "cc", icon: "📖", label: "Les conventions collectives" },
  { key: "acc", icon: "✍️", label: "Les accords d'entreprise" },
  { key: "grille", icon: "📊", label: "La grille de salaire" },
  { key: "charte", icon: "📄", label: "Les autres documents" },
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["key"];

export const DOCUMENT_CATEGORY_INTROS: Record<DocumentCategory, string> = {
  cc: "Cliquez sur une convention pour l'ouvrir sur Légifrance : vous consultez toujours la version à jour.",
  acc: "Vos accords d'entreprise, classés par année de signature.",
  grille: "La grille des minima applicables dans votre entreprise.",
  charte: "Chartes, notes de service et autres documents internes, classés par année.",
};

export function isDocumentCategory(value: string): value is DocumentCategory {
  return DOCUMENT_CATEGORIES.some((c) => c.key === value);
}

export function documentCategoryLabel(key: DocumentCategory): string {
  return DOCUMENT_CATEGORIES.find((c) => c.key === key)!.label;
}

export interface CompanyDocument {
  id: string;
  category: DocumentCategory;
  name: string;
  meta: string | null;
  doc_date: string | null;
  url: string | null;
  file_path: string | null;
}

// Correctif (05/10/2026), suite à la réponse de Pauline ("pour les
// accords et autres il nous faut la possibilité pour l'utilisateur
// d'importer des docs PDF donc oui un vrai stockage") : premier vrai
// stockage de fichiers de l'appli (migration 20261005090000). Bucket
// privé -- jamais de lecture par chemin public deviné, seulement via
// URL signée à la demande (`createSignedUrl`), générée côté serveur
// avant d'atteindre le navigateur.
export const COMPANY_DOCUMENTS_BUCKET = "company-documents";
export const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes -- assez pour ouvrir/télécharger, jamais un lien permanent

// Classement par année décroissante, port 1:1 de la logique de
// `renderDocDetail()` (~L10290-10293). Générique pour accepter aussi bien
// `CompanyDocument` que des variantes enrichies (ex. `previewUrl` résolu
// côté serveur pour les fichiers stockés).
export function groupDocumentsByYear<T extends CompanyDocument>(docs: T[]): [string, T[]][] {
  const byYear = new Map<string, T[]>();
  for (const doc of docs) {
    const year = doc.doc_date?.slice(0, 4) || "Sans date";
    byYear.set(year, [...(byYear.get(year) ?? []), doc]);
  }
  return [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}
