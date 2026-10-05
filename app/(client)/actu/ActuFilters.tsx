"use client";

// LBP-CLIENT-04 (correctif fidélité, 03/10/2026) : porté depuis
// `<select id="av-theme-sel" onchange="avSetTheme(this.value)">`
// (LBP_V9.9_Studio.html ~L2625/3682) -- le filtre thème s'applique au
// changement, aucun bouton "Filtrer" dans le vrai marquage. Même pattern
// que CalendarFilters.tsx (LBP-CLIENT-01). La recherche texte reste un
// champ simple validé par Entrée (le vrai `oninput="renderActuGrid()"`
// re-rend à chaque frappe côté client ; un aller-retour serveur à chaque
// touche n'est pas raisonnable ici).
export default function ActuFilters({
  action,
  categories,
  category,
  q,
}: {
  action: string;
  categories: string[];
  category: string | null;
  q: string | null;
}) {
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold text-muted">Filtrer par :</span>
      <select
        name="categorie"
        defaultValue={category ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-border bg-white px-3 py-2 text-sm text-ink"
      >
        <option value="">Tous les thèmes</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="text"
        name="q"
        defaultValue={q ?? ""}
        placeholder="Rechercher un article, un mot-clé…"
        className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-ink"
      />
    </form>
  );
}
