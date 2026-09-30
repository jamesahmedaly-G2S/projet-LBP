import { normalizeIdccJs, type ParsedDocxCcnMention } from "./parse-docx";

/**
 * STU-IMPORT-02 : rapprochement des CCN détectées dans le document avec le
 * référentiel réel `ccn_catalog`. Pure fonction (pas de dépendance
 * Supabase ici) -- le catalogue est chargé une fois par l'appelant
 * (server action), réutilise `normalizeIdccJs()` (même fonction que
 * STU-IMPORT-01/normalize_idcc SQL, jamais une deuxième version).
 */
export interface CcnCatalogEntry {
  idcc: string;
  name: string;
}

export interface CcnMatch {
  normalizedIdcc: string;
  raw: string;
  headingContexts: string[];
  matched: CcnCatalogEntry | null;
}

export function matchCcnMentions(
  mentions: ParsedDocxCcnMention[],
  catalog: CcnCatalogEntry[],
): CcnMatch[] {
  const byNormalized = new Map<string, CcnCatalogEntry>();
  for (const entry of catalog) {
    const normalized = normalizeIdccJs(entry.idcc);
    if (normalized) byNormalized.set(normalized, entry);
  }

  const grouped = new Map<string, CcnMatch>();
  for (const m of mentions) {
    const existing = grouped.get(m.normalizedIdcc);
    if (existing) {
      if (!existing.headingContexts.includes(m.headingContext)) {
        existing.headingContexts.push(m.headingContext);
      }
      continue;
    }
    grouped.set(m.normalizedIdcc, {
      normalizedIdcc: m.normalizedIdcc,
      raw: m.raw,
      headingContexts: [m.headingContext],
      matched: byNormalized.get(m.normalizedIdcc) ?? null,
    });
  }
  return [...grouped.values()];
}
