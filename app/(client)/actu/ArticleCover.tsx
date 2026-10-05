import { fnv1aIndex } from "@/lib/hash";

// LBP-CLIENT-04 (finitions design, 01/10/2026) : couverture générée quand
// l'article n'a pas d'image, portée depuis le vrai prototype
// (LBP_V9.9_Studio.html, avMedia()/AV_COVER/AV_MOTIF, lignes ~3656-3706) --
// motif SVG (deux arcs concentriques) + logo "G2S" + libellé en grand,
// sur l'un de 3 fonds (framboise/carbone/mineral clair).
//
// Le prototype choisit la couleur depuis un tag fixe à 3 valeurs
// ("Veille réglementaire"/"Actualité"/"Décryptage RH&Paie"). Notre
// `articles.category` est un champ texte libre (l'admin tape ce qu'il
// veut, ArticlesManager.tsx) -- pas de liste fermée à mapper 1:1. Adapté
// en hash déterministe de la catégorie vers l'une des 3 teintes : la même
// catégorie a toujours la même couleur, sans dépendre d'une liste figée.
// Hash (`fnv1aIndex`, `lib/hash.ts`, extrait d'ici le 04/10/2026 pour être
// réutilisé par TeamSection.tsx) plutôt qu'un hash "h*31+c" classique :
// avec un petit modulo (3 ici), 31 ≡ 1 (mod 3) le fait dégénérer en une
// simple somme de codes de caractères -- vérifié en testant avec les
// vraies catégories du prototype (toutes retombaient sur la même
// variante).
const COVER_VARIANTS = [
  { bg: "bg-primary", text: "text-white" },
  { bg: "bg-ink", text: "text-white" },
  { bg: "bg-[#f1ecee]", text: "text-ink" },
] as const;

export default function ArticleCover({
  category,
  type,
  featured = false,
}: {
  category: string | null;
  type: "article" | "pdf";
  featured?: boolean;
}) {
  const variant = COVER_VARIANTS[fnv1aIndex(category ?? "Analyse", COVER_VARIANTS.length)];
  const label = type === "pdf" ? "Dossier" : (category ?? "Analyse");

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden ${variant.bg} ${variant.text}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-[12%] -bottom-[38%] h-auto w-3/4 opacity-10"
        focusable="false"
      >
        <g fill="none" stroke="currentColor" strokeWidth="14">
          <path d="M170 100a70 70 0 1 1-20.5-49.5" />
          <path d="M135 100a35 35 0 1 1-10.3-24.7" />
        </g>
      </svg>
      {!featured && (
        <span className="absolute top-[10%] left-[7%] text-sm font-extrabold">G2S</span>
      )}
      <span className="absolute bottom-[11%] left-[7%] block text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
        {label}
      </span>
    </div>
  );
}
