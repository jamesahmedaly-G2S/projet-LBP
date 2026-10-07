import { fnv1aIndex } from "@/lib/hash";

// LBP-CLIENT-04 (finitions design, 01/10/2026) : couverture générée quand
// l'article n'a pas d'image, portée depuis le vrai prototype
// (LBP_V9.9_Studio.html, avMedia()/AV_COVER/AV_MOTIF, lignes ~3656-3706) --
// motif SVG (deux arcs concentriques) + logo "G2S" + libellé en grand,
// sur l'un de 3 fonds (framboise/carbone/mineral clair).
//
// Le prototype choisit la couleur depuis le premier tag (`avTag(a)`, notre
// `subcategories[0]`) parmi 3 valeurs fixes ("Veille réglementaire" →
// framboise/"Veille", "Actualité" → carbone, "Décryptage RH&Paie" →
// minéral/"Décryptage") : repris tel quel quand le tag correspond. Nos
// tags étant du texte libre (ArticlesManager.tsx), un tag hors de cette
// liste retombe sur un hash déterministe de la catégorie (`fnv1aIndex`,
// `lib/hash.ts`) -- la même catégorie a toujours la même couleur.
//
// Correctif fidélité (06/10/2026), mesuré sur le rendu de la maquette
// (`.g2-cover*`, ~L2336-2345) : conteneur `container-type:inline-size`,
// logo `clamp(.75rem,5cqw,1.1rem)`, libellé `clamp(1rem,8cqw,2.2rem)` 800
// / -.02em / lh 1.05, motif `right:-12%;bottom:-38%;width:74%`, opacité
// .10 (.14 et framboise sur fond minéral). `ratio` : 16/9 par défaut,
// 2/1 dans la grille (`.avx-grid`), libre ("fill") dans l'article à la une
// et l'en-tête d'article (le parent fixe la hauteur).
type Variant = "framboise" | "carbone" | "mineral";

const VARIANT_CLASSES: Record<Variant, string> = {
  framboise: "bg-primary text-white",
  carbone: "bg-ink text-white",
  mineral: "bg-[#f1ecee] text-ink",
};

const HASH_VARIANTS: Variant[] = ["framboise", "carbone", "mineral"];

const TAG_COVER: Record<string, [Variant, string]> = {
  "Veille réglementaire": ["framboise", "Veille"],
  Actualité: ["carbone", "Actualité"],
  "Décryptage RH&Paie": ["mineral", "Décryptage"],
};

const RATIO_CLASSES = {
  video: "aspect-video",
  wide: "aspect-[2/1]",
  fill: "h-full",
} as const;

export default function ArticleCover({
  category,
  tag = null,
  type,
  ratio = "video",
  showLogo = true,
}: {
  category: string | null;
  tag?: string | null;
  type: "article" | "pdf";
  ratio?: keyof typeof RATIO_CLASSES;
  showLogo?: boolean;
}) {
  const mapped = tag ? TAG_COVER[tag] : undefined;
  const variant: Variant =
    mapped?.[0] ?? HASH_VARIANTS[fnv1aIndex(category ?? "Analyse", HASH_VARIANTS.length)];
  const label = type === "pdf" ? "Dossier" : (mapped?.[1] ?? category ?? "Analyse");

  return (
    <div
      className={`relative block w-full overflow-hidden leading-[1.2] @container ${RATIO_CLASSES[ratio]} ${VARIANT_CLASSES[variant]}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 200"
        className={`pointer-events-none absolute -right-[12%] -bottom-[38%] h-auto w-[74%] ${
          variant === "mineral" ? "text-primary opacity-[0.14]" : "opacity-10"
        }`}
        focusable="false"
      >
        <g fill="none" stroke="currentColor" strokeWidth="14">
          <path d="M170 100a70 70 0 1 1-20.5-49.5" />
          <path d="M135 100a35 35 0 1 1-10.3-24.7" />
        </g>
      </svg>
      {showLogo && (
        <span className="absolute top-[10%] left-[7%] text-[clamp(.75rem,5cqw,1.1rem)] font-extrabold">
          G2S
        </span>
      )}
      <span className="absolute right-[7%] bottom-[11%] left-[7%] block">
        <span className="block text-[clamp(1rem,8cqw,2.2rem)] leading-[1.05] font-extrabold tracking-[-0.02em]">
          {label}
        </span>
      </span>
    </div>
  );
}
