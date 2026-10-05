import Link from "next/link";
import type { VeilleSuggestion } from "@/lib/studio/veille-suggestion";

// STU-VEILLE-02 (correctif 27/09/2026) : port visuel de `.veille-sugg`
// (`LBP_V6_Studio.html`) — encadré en pointillés proposant le thème
// suggéré par recoupement de mots (jamais une IA), avant même que
// l'utilisateur choisisse entre "fiche existante" et "nouvelle fiche".
// Les deux options de QualificationForms restent toujours visibles à côté
// (STU-VEILLE-02, critère d'acceptation) — ceci n'est qu'une aide au choix.
export default function SuggestionBanner({
  suggestion,
  matchingSheets,
}: {
  suggestion: VeilleSuggestion;
  matchingSheets: { id: string; code: string; title: string }[];
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-dashed border-studio-amber bg-studio-amber-bg px-3 py-2.5 text-sm text-studio-navy">
      <span>
        Suggestion : thème <strong>{suggestion.themeName}</strong>
        {suggestion.subthemeName && (
          <>
            {" "}
            — sous-thème <strong>{suggestion.subthemeName}</strong>
          </>
        )}
      </span>
      {matchingSheets.length > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {matchingSheets.map((sheet) => (
            <Link
              key={sheet.id}
              href={`/referentiel/${sheet.id}`}
              className="rounded-full border border-studio-amber/50 bg-white px-2.5 py-0.5 text-xs font-medium text-studio-blue hover:underline"
            >
              {sheet.title} ({sheet.code})
            </Link>
          ))}
        </span>
      )}
    </div>
  );
}
