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

const USER_AGENT = "Mozilla/5.0 (compatible; LBP-Veille/1.0; +https://groupe-2s.com)";
const MAX_ITEMS = 15;

/**
 * STU-VEILLE-04 (AUTOMATION-02, #86) — scraping léger générique, mêmes
 * sélecteurs CSS que l'annexe 5.1 du cahier des charges réel
 * (`LBP_Cahier_des_charges_et_technique-3.pdf`, trouvé dans
 * `Nouveau dossier/`), pas des sélecteurs devinés. Cheerio (bibliothèque
 * réelle, ajoutée en dépendance) plutôt qu'un DOMParser maison.
 *
 * Non vérifiable en exécution depuis cet environnement : le handshake TLS
 * réussit (certificat valide vérifié) mais la connexion est reset dès
 * l'envoi de la requête HTTP (`curl -v` contre boss.gouv.fr/urssaf.fr,
 * `errno 10054`) — signature d'un blocage réseau propre à ce bac à sable,
 * pas une preuve que la source est injoignable en conditions réelles.
 * Le code suit fidèlement le patron `collectFromSource()` de l'annexe ;
 * `ConnectorResult.status` remonte "error" si l'exécution réelle échoue,
 * jamais un résultat inventé pour compenser.
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
      itemSelector: ".actualite, article, .fr-card",
      titleSelector: "h2, h3, .fr-card__title",
      linkSelector: "a",
      dateSelector: "time, .date",
    },
    {
      key: "urssaf",
      label: "URSSAF",
      url: "https://www.urssaf.fr/accueil/actualites.html",
      itemSelector: "article, .card",
      titleSelector: "h2, h3",
      linkSelector: "a",
      dateSelector: "time",
    },
    {
      key: "code-travail-numerique",
      label: "Code du travail numérique",
      url: "https://code.travail.gouv.fr/actualites",
      itemSelector: "article, li",
      titleSelector: "h2, h3, a",
      linkSelector: "a",
      dateSelector: "time",
    },
    {
      key: "ameli",
      label: "Ameli",
      url: "https://www.ameli.fr/yvelines/assure/actualites",
      itemSelector: "article, .card",
      titleSelector: "h2, h3",
      linkSelector: "a",
      dateSelector: "time",
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
          headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr-FR" },
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
