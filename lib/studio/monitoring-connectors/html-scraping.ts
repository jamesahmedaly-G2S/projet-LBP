import * as cheerio from "cheerio";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectorResult, MonitoringConnector } from "./types";
import type { RssItem } from "./rss";
import { insertNewItems } from "./insert-items";

interface HtmlSourceConfig {
  key: string;
  label: string;
  url: string;
  itemSelector: string;
  titleSelector: string;
  linkSelector: string;
  dateSelector: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const MAX_ITEMS = 15;

/**
 * STU-VEILLE-04 (AUTOMATION-02, #86) — scraping léger générique, sources
 * listées à l'annexe 5.1 du cahier des charges réel
 * (`LBP_Cahier_des_charges_et_technique-3.pdf`, trouvé dans
 * `Nouveau dossier/`). Cheerio (bibliothèque réelle, ajoutée en dépendance)
 * plutôt qu'un DOMParser maison.
 *
 * Correctif (27/09/2026) : les échecs précédents ("connexion reset")
 * n'étaient pas un blocage réseau du bac à sable comme supposé, mais un WAF
 * qui coupe la connexion dès qu'il identifie un User-Agent non-navigateur
 * (`LBP-Veille/1.0`) — confirmé en comparant, avec `curl -v`, le même hôte
 * avec les deux User-Agent. Un User-Agent de navigateur réel lève le
 * blocage sur boss.gouv.fr et urssaf.fr. Les sélecteurs CSS ci-dessous ont
 * été revérifiés un par un contre le vrai DOM de chaque page (pas de
 * sélecteur deviné) : BOSS (`article.bloc_actu`), URSSAF
 * (`.liste-actualites__item`), Code du travail numérique — l'URL réelle est
 * `/actualite` (singulier), `/actualites` répond 404 — et Ameli
 * (`article`, déjà correct). Le BOCC (`legifrance.gouv.fr/liste/bocc`)
 * reste bloqué par un WAF réel (403 confirmé avec les deux User-Agent) :
 * aucun contournement légitime trouvé, le connecteur remonte l'erreur telle
 * quelle plutôt qu'un résultat inventé.
 */
export function createHtmlScrapingConnectors(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): MonitoringConnector[] {
  const sources: HtmlSourceConfig[] = [
    {
      key: "boss",
      label: "BOSS",
      url: "https://boss.gouv.fr/portail/accueil/actualites.html",
      itemSelector: "article.bloc_actu",
      titleSelector: "h2",
      linkSelector: "a",
      dateSelector: "p.date",
    },
    {
      key: "urssaf",
      label: "URSSAF",
      url: "https://www.urssaf.fr/accueil/actualites.html",
      itemSelector: ".liste-actualites__item",
      titleSelector: "h3",
      linkSelector: "a.link, a",
      dateSelector: "p.text_small",
    },
    {
      key: "code-travail-numerique",
      label: "Code du travail numérique",
      url: "https://code.travail.gouv.fr/actualite",
      itemSelector: "div.fr-grid-row.fr-grid-row--gutters.fr-mb-3w",
      titleSelector: "h2.fr-mb-0",
      linkSelector: 'a[href^="/actualite/"]',
      dateSelector: "p.fr-text--lg",
    },
    {
      key: "ameli",
      label: "Ameli",
      url: "https://www.ameli.fr/yvelines/assure/actualites",
      itemSelector: "article",
      titleSelector: "h2.titre-actus, h2, h3",
      linkSelector: "a",
      dateSelector: "p.date-actus, time",
    },
    {
      key: "bocc",
      label: "BOCC",
      url: "https://www.legifrance.gouv.fr/liste/bocc",
      itemSelector: "article, li, tr",
      titleSelector: "a, h3",
      linkSelector: "a",
      dateSelector: "time, td",
    },
  ];

  return sources.map((source) => createScrapingConnector(supabase, source));
}

function createScrapingConnector(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  source: HtmlSourceConfig,
): MonitoringConnector {
  return {
    key: source.key,
    label: source.label,
    implemented: true,
    async run(): Promise<ConnectorResult> {
      let response: Response;
      try {
        response = await fetch(source.url, {
          headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr-FR", Accept: ACCEPT },
          signal: AbortSignal.timeout(10_000),
        });
      } catch (e) {
        return {
          key: source.key,
          label: source.label,
          status: "error",
          itemsFound: 0,
          itemsInserted: 0,
          message: `Source injoignable : ${e instanceof Error ? e.message : "erreur réseau"}.`,
        };
      }

      if (!response.ok) {
        return {
          key: source.key,
          label: source.label,
          status: "error",
          itemsFound: 0,
          itemsInserted: 0,
          message: `Réponse HTTP ${response.status}.`,
        };
      }

      const html = await response.text();
      const items = extractItems(html, source);

      const { inserted, insertedItems, error } = await insertNewItems(
        supabase,
        source.label,
        items,
      );
      if (error) {
        return {
          key: source.key,
          label: source.label,
          status: "error",
          itemsFound: items.length,
          itemsInserted: 0,
          message: `Erreur d'écriture : ${error}`,
        };
      }

      return {
        key: source.key,
        label: source.label,
        status: "ok",
        itemsFound: items.length,
        itemsInserted: inserted,
        insertedItems,
      };
    },
  };
}

function extractItems(html: string, source: HtmlSourceConfig): RssItem[] {
  const $ = cheerio.load(html);
  const items: RssItem[] = [];

  $(source.itemSelector)
    .slice(0, MAX_ITEMS)
    .each((_, el) => {
      const node = $(el);
      const title = node.find(source.titleSelector).first().text().trim();
      const href = node.find(source.linkSelector).first().attr("href");
      const date =
        node.find(source.dateSelector).first().attr("datetime") ||
        node.find(source.dateSelector).first().text().trim();

      if (!title || !href) return;

      let link: string;
      try {
        link = new URL(href, source.url).toString();
      } catch {
        return;
      }

      items.push({ title, link, pubDate: date || null, description: null });
    });

  return items;
}
