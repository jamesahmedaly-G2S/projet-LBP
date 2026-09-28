"use client";

import { useMemo, useState } from "react";
import { Card } from "@/ui-kit/Card";

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

// Pendant client de renderDico() (LBP_V6_Studio.html, lignes 4642-4670) :
// recherche, regroupement alphabétique, navigation par lettre — sans les
// outils d'édition (g2s-only dans le prototype), cette page ne montre que
// les termes publiés (déjà filtré côté serveur par la RLS
// dictionary_terms_read).
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
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un terme…"
        className="w-full max-w-sm rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink focus:border-primary focus:outline-none"
      />

      <div className="mt-4 flex flex-wrap gap-1">
        {ALPHABET.map((letter) => {
          const on = availableLetters.has(letter);
          return on ? (
            <a
              key={letter}
              href={`#dico-${letter}`}
              className="flex h-6 w-6 items-center justify-center rounded text-xs font-semibold text-primary hover:bg-primary-soft"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="flex h-6 w-6 items-center justify-center text-xs text-muted/40"
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
            <div key={letter} id={`dico-${letter}`} className="mt-6 scroll-mt-24">
              <h2 className="border-b border-border pb-1 text-lg font-bold text-primary">
                {letter}
              </h2>
              <div className="mt-2 flex flex-col gap-2">
                {items.map((t) => (
                  <Card key={t.id}>
                    <p className="font-semibold text-ink">{t.term}</p>
                    <p className="mt-1 text-sm text-ink">{t.definition}</p>
                    {t.source && (
                      <p className="mt-1 text-xs italic text-muted">Source : {t.source}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
