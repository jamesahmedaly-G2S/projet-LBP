import type { SupabaseClient } from "@supabase/supabase-js";
import type { RssItem } from "./rss";
import { toDateOnly } from "./rss";

export interface InsertResult {
  inserted: number;
  insertedItems: { source: string; title: string; link: string | null }[];
  error: string | null;
}

/**
 * Insère les items non encore vus (dédoublonnage sur `link`, requête
 * applicative — pas de contrainte unique ajoutée sur `legal_monitoring`,
 * table de James, jamais modifiée). Une erreur d'écriture remonte
 * explicitement (jamais avalée) : le connecteur appelant doit la refléter
 * dans son `ConnectorResult.status`.
 */
export async function insertNewItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  source: string,
  items: RssItem[],
): Promise<InsertResult> {
  if (items.length === 0) return { inserted: 0, insertedItems: [], error: null };

  const links = items.map((item) => item.link);
  const { data: existing, error: readError } = await supabase
    .from("legal_monitoring")
    .select("link")
    .in("link", links);
  if (readError) return { inserted: 0, insertedItems: [], error: readError.message };

  const existingLinks = new Set((existing ?? []).map((row) => row.link));

  const toInsert = items
    .filter((item) => !existingLinks.has(item.link))
    .map((item) => ({
      source,
      title: item.title,
      link: item.link,
      text_date: toDateOnly(item.pubDate),
      summary: item.description,
    }));

  if (toInsert.length === 0) return { inserted: 0, insertedItems: [], error: null };

  const { error } = await supabase.from("legal_monitoring").insert(toInsert);
  if (error) return { inserted: 0, insertedItems: [], error: error.message };
  return {
    inserted: toInsert.length,
    insertedItems: toInsert.map((i) => ({ source: i.source, title: i.title, link: i.link })),
    error: null,
  };
}
