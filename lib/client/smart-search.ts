// LBP-CLIENT-12 : algorithme de recherche porté 1:1 depuis le vrai
// prototype (LBP_V9.9_Studio.html, norm()/normTokens()/tokenMatch()/
// smartMatch(), lignes ~3978-3998) -- déjà cité comme "à conserver
// impérativement en cible" (docs/front/SPEC-FRONT-0001.md §7, cahier des
// charges §4.6, p.21) et vérifié cohérent entre la recherche bibliothèque,
// la recherche globale et le filtre d'actualités dans le prototype.
// Tolérance : préfixe commun d'au moins 4 caractères (congé/conges/congés),
// pas une distance de Levenshtein -- reprise telle quelle, pas réinventée.
export function normalizeSearchText(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeSearchTokens(s: string): string[] {
  const n = normalizeSearchText(s);
  return n.length ? n.split(" ").filter(Boolean) : [];
}

function tokenMatch(hayToken: string, needle: string): boolean {
  if (hayToken === needle) return true;
  if (needle.length >= 4 && hayToken.indexOf(needle) === 0) return true;
  if (hayToken.length >= 4 && needle.indexOf(hayToken) === 0) return true;
  return false;
}

export function smartMatch(text: string, query: string): boolean {
  const q = normalizeSearchTokens(query);
  if (!q.length) return false;
  const h = normalizeSearchTokens(text);
  return q.every((t) => h.some((x) => tokenMatch(x, t)));
}

// Aplatit un contenu jsonb de fiche (sheet_versions.content) en un seul
// texte de recherche -- pendant de ficheBlob() (LBP_V9.9_Studio.html,
// ligne ~10778), qui concatène tous les champs enbref/comprendre/detail/
// application/vigilance/quiz d'une fiche. Ici générique (parcourt toutes
// les valeurs texte du JSON) plutôt qu'une liste de clés fixes : notre
// structure de contenu (import Word, STU-IMPORT) n'est pas garantie
// identique à celle, plus ancienne, du prototype.
export function flattenJsonText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenJsonText).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(flattenJsonText)
      .join(" ");
  }
  return "";
}
