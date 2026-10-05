/**
 * STU-VEILLE-04 (AUTOMATION-03, #87) — analyse IA d'une entrée de veille :
 * transformer le texte brut en JSON structuré, via l'API Claude
 * (`ANTHROPIC_API_KEY` + `CLAUDE_MODEL`, §3.15 du cahier).
 *
 * Prompt système et schéma JSON repris mot pour mot de l'annexe 5.1 du
 * cahier des charges réel (`LBP_Cahier_des_charges_et_technique-3.pdf`,
 * trouvé dans `Nouveau dossier/`) — pas un schéma inventé. L'appel HTTP
 * suit le contrat documenté et stable de l'API Messages Anthropic (connu
 * indépendamment, pas deviné comme l'aurait été un appel à l'API PISTE de
 * Légifrance) : implémenté pour de vrai, gardé derrière `ANTHROPIC_API_KEY`
 * — aucune clé fournie pour ce prototype (décision utilisateur,
 * 25/09/2026), donc jamais exécuté ici, mais prêt à fonctionner dès
 * qu'une clé est configurée.
 */

const SYSTEM_PROMPT = `Tu es juriste expert en paie et RH française, au service du cabinet G2S.

À partir d'un texte réglementaire brut, tu produis un objet JSON STRICT (aucun texte autour), au format :

{
"pertinent": true|false, // true seulement si le texte concerne la paie, les cotisations, le droit social ou la RH
"type": "Décret n°... | Arrêté du ... | Loi n°... | Doctrine BOSS | ...",
"intitule": "intitulé exact du texte",
"dateTexte": "date du texte (JJ mois AAAA)",
"datePublication": "AAAA-MM-JJ",
"dateEntreeVigueur": "1er ... AAAA ou 'à préciser'",
"lien": "URL officielle du texte",
"resume": "3 à 5 phrases claires, factuelles",
"impactRhPaie": "ce que cela implique concrètement en paie/RH",
"themeSuggere": 1..50, // numéro de thème LBP le plus proche
"motsCles": ["...","..."]
}

Règles : n'invente jamais une date ou une référence ; si une information manque, mets "à préciser".`;

export interface MonitoringAiAnalysis {
  pertinent: boolean;
  type: string;
  intitule: string;
  dateTexte: string;
  datePublication: string;
  dateEntreeVigueur: string;
  lien: string;
  resume: string;
  impactRhPaie: string;
  themeSuggere: number;
  motsCles: string[];
}

export interface AiAnalysisResult {
  status: "ok" | "not_configured" | "error";
  analysis: MonitoringAiAnalysis | null;
  message?: string;
}

interface AnalysisInput {
  source: string;
  link: string | null;
  publishedAt: string | null;
  rawText: string;
}

export async function analyzeMonitoringEntry(input: AnalysisInput): Promise<AiAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      status: "not_configured",
      analysis: null,
      message:
        "ANTHROPIC_API_KEY non configurée — analyse IA non exécutée (AUTOMATION-03, #87). " +
        "Le texte reste consultable et qualifiable manuellement (STU-VEILLE-02).",
    };
  }

  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content:
              `Source : ${input.source}\nLien : ${input.link ?? "inconnu"}\n` +
              `Date repérée : ${input.publishedAt ?? "inconnue"}\n\nTexte / titre :\n${input.rawText}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (e) {
    return {
      status: "error",
      analysis: null,
      message: `Appel Claude injoignable : ${e instanceof Error ? e.message : "erreur réseau"}.`,
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      analysis: null,
      message: `Claude HTTP ${response.status} : ${await response.text()}`,
    };
  }

  const data = await response.json();
  const text = (data.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("\n");
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const analysis = JSON.parse(clean) as MonitoringAiAnalysis;
    return { status: "ok", analysis };
  } catch {
    // Réponse non parseable : journalisée et ignorée sans interrompre le
    // reste du traitement (critère d'acceptation #87), jamais une analyse
    // inventée pour compenser.
    return {
      status: "error",
      analysis: null,
      message: "Réponse Claude non exploitable (JSON invalide) — ignorée.",
    };
  }
}
