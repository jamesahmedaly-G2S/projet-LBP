"use client";

import Link from "next/link";

// LBP-CLIENT-04 (correctif fidélité, 03/10/2026) : porté depuis
// `<select id="av-theme-sel" onchange="avSetTheme(this.value)">`
// (LBP_V9.9_Studio.html ~L2625/3682) -- le filtre thème s'applique au
// changement, aucun bouton "Filtrer" dans le vrai marquage. Même pattern
// que CalendarFilters.tsx (LBP-CLIENT-01). La recherche texte reste un
// champ simple validé par Entrée (le vrai `oninput="renderActuGrid()"`
// re-rend à chaque frappe côté client ; un aller-retour serveur à chaque
// touche n'est pas raisonnable ici).
//
// Correctif fidélité (06/10/2026), mesuré sur le rendu de la maquette
// (`.calf-bar.av-fbar`, ~L930-932/2273-2276 + marquage ~L2623-2629) :
// barre crème (#F5F0EC) radius 14 / padding 12px 16px / gap 10, libellé
// 12.5px 800, champs en pilule (13px, padding 8px 14px, bordure --ligne).
// Les deux contrôles manquants sont ajoutés : "Toutes les rubriques"
// (`av-rub-sel`, filtre sur le premier niveau de tags = nos
// `subcategories`) et le filtre par date (`actu-date-filter`), plus le
// bouton "Réinitialiser" (`#av-reset`, visible seulement si un filtre est
// actif). Le compteur "(n)" après chaque thème est celui du vrai `<option>`.
const fieldClass =
  "rounded-full border border-border bg-white px-3.5 py-2 text-[13px] text-ink focus:border-primary focus:outline-none";

export default function ActuFilters({
  action,
  categories,
  tags,
  category,
  tag,
  q,
  date,
}: {
  action: string;
  categories: { name: string; count: number }[];
  tags: string[];
  category: string | null;
  tag: string | null;
  q: string | null;
  date: string | null;
}) {
  const filtered = !!(category || tag || q || date);
  const submit = (e: { currentTarget: HTMLSelectElement | HTMLInputElement }) =>
    e.currentTarget.form?.requestSubmit();

  return (
    <form
      action={action}
      className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[14px] bg-[#F5F0EC] px-4 py-3"
    >
      <span className="text-[12.5px] font-extrabold text-muted">Filtrer par :</span>
      <select
        name="categorie"
        aria-label="Thème"
        defaultValue={category ?? ""}
        onChange={submit}
        className={`${fieldClass} cursor-pointer`}
      >
        <option value="">Tous les thèmes</option>
        {categories.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name} ({c.count})
          </option>
        ))}
      </select>
      <select
        name="rubrique"
        aria-label="Rubrique"
        defaultValue={tag ?? ""}
        onChange={submit}
        className={`${fieldClass} cursor-pointer`}
      >
        <option value="">Toutes les rubriques</option>
        {tags.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="q"
        aria-label="Rechercher"
        defaultValue={q ?? ""}
        placeholder="Rechercher un article, un mot-clé…"
        className={`${fieldClass} min-w-[200px] flex-1`}
      />
      <input
        type="date"
        name="date"
        aria-label="Date"
        title="Filtrer par date"
        defaultValue={date ?? ""}
        onChange={submit}
        className={`${fieldClass} min-w-0 flex-none`}
      />
      {filtered && (
        <Link
          href={action}
          className="inline-flex items-center rounded-[8px] border-[1.5px] border-primary bg-white px-[11px] py-[5px] text-xs font-bold text-primary hover:bg-primary hover:text-white"
        >
          Réinitialiser
        </Link>
      )}
    </form>
  );
}
