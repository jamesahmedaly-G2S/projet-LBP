/**
 * STU-VEILLE-04 (AUTOMATION-03, #87) — analyse IA d'une entrée de veille :
 * transformer le texte brut en JSON structuré (pertinence, type, titre,
 * dates, lien, résumé, impact RH/paie, thème suggéré, mots-clés), via
 * l'API Claude (`ANTHROPIC_API_KEY` + `CLAUDE_MODEL`, §3.15 du cahier).
 *
 * Pas de clé fournie pour ce prototype (décision utilisateur, 25/09/2026) :
 * plutôt que d'écrire un appel API que je ne peux pas tester contre le
 * vrai service, cette fonction reste un stub honnête qui documente le
 * schéma attendu et explique précisément pourquoi elle ne tourne pas —
 * prête à devenir un vrai appel dès qu'une clé est configurée.
 */

export interface MonitoringAiAnalysis {
  relevant: boolean;
  documentType: string | null;
  title: string;
  textDate: string | null;
  effectiveDate: string | null;
  link: string | null;
  summary: string;
  impact: string;
  suggestedTheme: string | null;
  keywords: string[];
}

export interface AiAnalysisResult {
  status: "ok" | "not_configured" | "error";
  analysis: MonitoringAiAnalysis | null;
  message?: string;
}

export async function analyzeMonitoringEntry(rawText: string): Promise<AiAnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: "not_configured",
      analysis: null,
      message:
        "ANTHROPIC_API_KEY non configurée — analyse IA non exécutée (AUTOMATION-03, #87). " +
        "Le texte reste consultable et qualifiable manuellement (STU-VEILLE-02).",
    };
  }

  // Volontairement non implémenté sans clé réelle pour valider le contrat
  // (format de réponse, gestion d'erreur JSON non parseable — critère
  // d'acceptation #87) : écrire un appel non testé serait moins honnête
  // qu'un stub qui le dit clairement.
  void rawText;
  return {
    status: "error",
    analysis: null,
    message: "Clé présente mais intégration non implémentée dans ce prototype.",
  };
}
