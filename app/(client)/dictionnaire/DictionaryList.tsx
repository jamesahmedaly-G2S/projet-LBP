"use client";

import { useMemo, useState } from "react";

export interface DictionaryTerm {
  id: string;
  term: string;
  definition: string;
  source: string | null;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Pendant client de renderDico() (LBP_V9.9_Studio.html, ~L10672-10705) :
// recherche, regroupement alphabétique, navigation par lettre — sans les
// outils d'édition (g2s-only dans le prototype), cette page ne montre que
// les termes publiés (déjà filtré côté serveur par la RLS
// dictionary_terms_read).
//
// Correctif fidélité (03/10/2026, "compare bien mot pour mot et taille
// pour taille") : tailles recalées sur les vraies valeurs CSS (`.dico-*`,
// ~L1167-1179) plutôt que des classes Tailwind approximatives -- lettres
// 26x26px (pas 24px), lettre active sur fond `--panel` par défaut (pas
// seulement au survol), titre de groupe en carbone (`--sage-deep`, pas
// framboise), carte à coins 12px/padding 13px 16px (pas le `<Card>`
// générique 16px/24px).
export default function DictionaryList({ terms }: { terms: DictionaryTerm[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return terms;
    return terms.filter((t) => normalize(`${t.term} ${t.definition}`).includes(q));
  }, [terms, query]);

  const groups = useMemo(() => {
    const map = new Map<string, DictionaryTerm[]>();
    for (const t of filtered) {
      const letter = normalize(t.term).charAt(0).toUpperCase() || "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return map;
  }, [filtered]);

  const availableLetters = new Set(groups.keys());

  return (
    <div>
      <div className="mb-3.5 flex max-w-[380px] items-center gap-2 rounded-full border border-border bg-white px-4 py-[9px]">
        {/* `.dico-search .gs-ic` du prototype : conteneur vide (0×0, aucun
            pictogramme rendu) -- seul l'écart `gap:8px` subsiste. */}
        <span aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un terme…"
          aria-label="Rechercher un terme"
          className="w-full bg-transparent text-[13.5px] text-ink focus:outline-none"
        />
      </div>

      <div className="mb-[18px] flex flex-wrap gap-[3px]">
        {ALPHABET.map((letter) => {
          const on = availableLetters.has(letter);
          return on ? (
            <a
              key={letter}
              href={`#dico-${letter}`}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-xs font-extrabold text-primary hover:bg-[#EFE7E1] hover:text-white"
              style={{ background: "#F5F0EC" }}
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="flex h-[26px] w-[26px] items-center justify-center text-xs font-extrabold text-[#C6BFC3]"
            >
              {letter}
            </span>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Aucun terme ne correspond à votre recherche.</p>
      ) : (
        Array.from(groups.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, items]) => (
            <div key={letter} id={`dico-${letter}`} className="mb-[22px] scroll-mt-24">
              <h2 className="mb-[10px] border-b-2 border-[#F5F0EC] pb-[5px] text-xl font-extrabold text-ink">
                {letter}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-white px-4 py-[13px]"
                  >
                    <p className="mb-1 text-[15.5px] leading-[1.5] font-extrabold text-[#33405A]">
                      {t.term}
                    </p>
                    <p className="text-[13.5px] leading-[1.65] text-ink">{t.definition}</p>
                    {t.source && (
                      <p className="mt-[5px] text-[11.5px] text-muted italic">
                        Source : {t.source}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
