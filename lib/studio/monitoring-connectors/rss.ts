/**
 * Parseur RSS minimal (regex) — pas de dépendance XML ajoutée pour un
 * besoin aussi ciblé (extraire title/link/pubDate/description de flux
 * RSS 2.0 bien formés). Suffisant pour les flux gouvernementaux visés ;
 * ne prétend pas gérer Atom ni du XML malformé.
 */
export interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
}

export function parseRssItems(xml: string): RssItem[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  const items: RssItem[] = [];

  for (const block of blocks) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate: extractTag(block, "pubDate"),
      description: extractTag(block, "description"),
    });
  }

  return items;
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;

  let value = match[1].trim();
  const cdata = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) value = cdata[1].trim();

  value = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  value = value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");

  return value || null;
}

/** RFC 822 (pubDate RSS) -> "YYYY-MM-DD" pour la colonne `text_date` (date). */
export function toDateOnly(pubDate: string | null): string | null {
  if (!pubDate) return null;
  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}
