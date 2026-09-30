import JSZip from "jszip";

/**
 * STU-IMPORT-01 : lecture native du DOCX (§7.1, §7.3, §8.1 du cahier des
 * charges technique V9.4). Mammoth/`extractRawText` sont explicitement
 * exclus par le cahier (§7.2, §1.1) -- perdent la structure (titres,
 * tableaux, listes) en aplatissant tout en texte brut. Ce module lit
 * directement `word/document.xml` (un .docx est un zip de fichiers XML) et
 * en reconstruit la structure nous-mêmes, sans dépendance de "conversion".
 *
 * Choix délibéré : les 6 sections de la structure éditoriale obligatoire
 * (§8.1) sont reconnues par le TEXTE de leur titre (normalisé, comparé à des
 * variantes connues), jamais par leur niveau de titre Word (Heading1/2/3...).
 * Le cahier dit explicitement que les CCN sont détectées "quel que soit le
 * niveau de titre" (§7.3) -- rien n'indique que G2S utilise un niveau fixe
 * pour les 6 sections non plus, et le composer par texte fonctionne quel
 * que soit le gabarit Word réellement utilisé par les rédacteurs.
 */

export type SheetSectionField =
  "essentiel" | "comprendre" | "maitriser" | "application" | "vigilance" | "quiz";

export interface ParsedDocxTable {
  headers: string[];
  rows: string[][];
}

export type ParsedDocxBlock =
  | { type: "paragraph"; text: string }
  | { type: "list-item"; text: string }
  | { type: "table"; table: ParsedDocxTable };

export interface ParsedDocxSection {
  /** null = rubrique inconnue -- jamais perdue, juste non rattachée à un champ. */
  field: SheetSectionField | null;
  headingText: string;
  headingLevel: number;
  blocks: ParsedDocxBlock[];
}

export interface ParsedDocxCcnMention {
  raw: string;
  normalizedIdcc: string;
  headingContext: string;
}

export interface ParsedDocx {
  numeroFiche: string | null;
  titre: string | null;
  sections: ParsedDocxSection[];
  ccnMentions: ParsedDocxCcnMention[];
}

/** Même règle que normalize_idcc() (migration 20260929160000) : ne conserver
 * que les chiffres puis supprimer les zéros initiaux -- une seule fonction
 * de normalisation, jamais une deuxième version qui pourrait diverger. */
export function normalizeIdccJs(raw: string): string | null {
  const digitsOnly = raw.replace(/\D/g, "");
  const stripped = digitsOnly.replace(/^0+/, "");
  return stripped === "" ? null : stripped;
}

const SECTION_KEYWORDS: { field: SheetSectionField; keywords: string[] }[] = [
  { field: "essentiel", keywords: ["essentiel a retenir", "lessentiel"] },
  { field: "comprendre", keywords: ["comprendre la regle"] },
  { field: "maitriser", keywords: ["maitriser la regle", "dans le detail"] },
  {
    field: "application",
    keywords: ["application concrete", "application en paie", "appliquer concretement"],
  },
  { field: "vigilance", keywords: ["points de vigilance", "vigilance"] },
  { field: "quiz", keywords: ["quiz"] },
];

function normalizeHeadingText(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchSectionField(headingText: string): SheetSectionField | null {
  const normalized = normalizeHeadingText(headingText);
  for (const { field, keywords } of SECTION_KEYWORDS) {
    if (keywords.some((k) => normalized.includes(k))) return field;
  }
  return null;
}

const CCN_PATTERN = /IDCC\s*n?°?\s*(\d{1,5})/gi;

function decodeXmlEntities(raw: string): string {
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractText(xmlFragment: string): string {
  // \b après "w:t" est indispensable -- sans lui, "[^>]*" absorbe aussi les
  // lettres de <w:tc>/<w:tbl>/<w:tr>/<w:tab> (qui commencent tous par
  // "w:t"), matchant leur balise ouvrante entière comme si c'était un texte
  // -- bug réel trouvé en testant contre un vrai .docx généré (tableau
  // rendu avec les balises XML brutes au lieu du texte des cellules).
  const texts = [...xmlFragment.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) =>
    decodeXmlEntities(m[1]),
  );
  return texts.join("").trim();
}

function headingLevelOf(paragraphXml: string): number | null {
  const pPrMatch = paragraphXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
  if (!pPrMatch) return null;
  const pPr = pPrMatch[1];

  const styleMatch = pPr.match(/<w:pStyle w:val="([^"]+)"/);
  if (styleMatch) {
    const style = styleMatch[1];
    // Le style "Title"/"Titre" (sans numéro) est le titre principal du
    // document (niveau 0, distinct des 6 sections numérotées) -- testé
    // avec un vrai .docx généré par la librairie docx, qui utilise ce
    // style précis pour le titre.
    if (/^(?:Title|Titre)$/i.test(style)) return 0;
    const m = style.match(/^(?:Heading|heading|Titre|titre)\s*(\d)$/);
    if (m) return Number(m[1]);
  }

  const outlineMatch = pPr.match(/<w:outlineLvl w:val="(\d+)"/);
  if (outlineMatch) return Number(outlineMatch[1]) + 1;

  return null;
}

function isListItem(paragraphXml: string): boolean {
  const pPrMatch = paragraphXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
  return !!pPrMatch && /<w:numPr>/.test(pPrMatch[1]);
}

function parseTable(tableXml: string): ParsedDocxTable {
  const rowsXml = [...tableXml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)].map((m) => m[0]);
  const rows = rowsXml.map((rowXml) => {
    const cellsXml = [...rowXml.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map((m) => m[0]);
    return cellsXml.map((cellXml) => extractText(cellXml));
  });
  const [headers, ...dataRows] = rows;
  return { headers: headers ?? [], rows: dataRows };
}

interface FicheHeader {
  numero: string | null;
  titre: string | null;
}

function parseFicheHeader(headingText: string): FicheHeader {
  const m = headingText.match(/^(\d{2}\.\d{2})\s*[—–-]\s*(.+)$/);
  if (m) return { numero: m[1], titre: m[2].trim() };
  return { numero: null, titre: headingText.trim() || null };
}

export async function parseDocx(buffer: Buffer): Promise<ParsedDocx> {
  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("Fichier .docx invalide : word/document.xml introuvable.");
  }
  const xml = await documentFile.async("string");

  const bodyMatch = xml.match(/<w:body>([\s\S]*)<\/w:body>/);
  const body = bodyMatch ? bodyMatch[1] : xml;

  // Les tableaux sont remplacés par un jeton avant de découper les
  // paragraphes -- un <w:tbl> contient lui-même des <w:p> (dans ses
  // cellules) qu'il ne faut jamais confondre avec les paragraphes du corps
  // du document.
  const extractedTables: string[] = [];
  const withoutTables = body.replace(/<w:tbl\b[\s\S]*?<\/w:tbl>/g, (match) => {
    extractedTables.push(match);
    return `\u0000TABLE_${extractedTables.length - 1}\u0000`;
  });

  const nodes: ({ kind: "table"; index: number } | { kind: "paragraph"; xml: string })[] = [];
  let cursor = 0;
  const tableTokenPattern = /\u0000TABLE_(\d+)\u0000/g;
  let tokenMatch: RegExpExecArray | null;
  const segments: { text: string; tokenIndex: number | null }[] = [];
  while ((tokenMatch = tableTokenPattern.exec(withoutTables))) {
    segments.push({ text: withoutTables.slice(cursor, tokenMatch.index), tokenIndex: null });
    segments.push({ text: "", tokenIndex: Number(tokenMatch[1]) });
    cursor = tableTokenPattern.lastIndex;
  }
  segments.push({ text: withoutTables.slice(cursor), tokenIndex: null });

  for (const segment of segments) {
    if (segment.tokenIndex !== null) {
      nodes.push({ kind: "table", index: segment.tokenIndex });
      continue;
    }
    const paragraphs = [...segment.text.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((m) => m[0]);
    for (const p of paragraphs) nodes.push({ kind: "paragraph", xml: p });
  }

  const sections: ParsedDocxSection[] = [];
  const ccnMentions: ParsedDocxCcnMention[] = [];
  let currentSection: ParsedDocxSection | null = null;
  let ficheHeader: FicheHeader | null = null;
  let currentHeadingContext = "";

  for (const node of nodes) {
    if (node.kind === "table") {
      const table = parseTable(extractedTables[node.index]);
      if (currentSection) currentSection.blocks.push({ type: "table", table });
      continue;
    }

    const level = headingLevelOf(node.xml);
    const text = extractText(node.xml);
    if (!text) continue;

    for (const m of text.matchAll(CCN_PATTERN)) {
      const normalized = normalizeIdccJs(m[1]);
      if (normalized) {
        ccnMentions.push({
          raw: m[0],
          normalizedIdcc: normalized,
          headingContext: currentHeadingContext,
        });
      }
    }

    if (level !== null) {
      currentHeadingContext = text;
      if (ficheHeader === null) {
        ficheHeader = parseFicheHeader(text);
        continue;
      }
      const field = matchSectionField(text);
      currentSection = { field, headingText: text, headingLevel: level, blocks: [] };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      // Contenu avant la première section reconnue -- conservé comme
      // rubrique inconnue plutôt que perdu silencieusement (§7.2).
      currentSection = {
        field: null,
        headingText: "(avant tout titre reconnu)",
        headingLevel: 0,
        blocks: [],
      };
      sections.push(currentSection);
    }
    currentSection.blocks.push({
      type: isListItem(node.xml) ? "list-item" : "paragraph",
      text,
    });
  }

  return {
    numeroFiche: ficheHeader?.numero ?? null,
    titre: ficheHeader?.titre ?? null,
    sections,
    ccnMentions,
  };
}
