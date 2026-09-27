import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Libellés des 6 origines calculées par la vue (§7.3 du dossier — 5
 * origines attendues par le ticket : base/questionnaire/ccn/offre/manuel ;
 * + `maj`, absente des tickets mais confirmée dans LBP_V6_Studio.html, la
 * référence réelle). `offre` était manquante dans la version initiale de
 * la vue — corrigé le 27/09/2026 après relecture du vrai prototype.
 */
export const ORIGIN_LABELS: Record<string, string> = {
  base: "Référentiel",
  questionnaire: "Questionnaire",
  ccn: "Convention collective",
  offre: "Offre",
  manual: "Ajout manuel G2S",
  maj: "Mise à jour",
};

export function getOriginLabel(origin: string): string {
  return ORIGIN_LABELS[origin] ?? origin;
}

const ORIGIN_TONES: Record<string, "neutral" | "blue" | "green" | "amber" | "red"> = {
  manual: "amber",
  maj: "blue",
};

export function getOriginTone(origin: string): "neutral" | "blue" | "green" | "amber" | "red" {
  return ORIGIN_TONES[origin] ?? "neutral";
}

export interface CompanyAffectation {
  masterSheetId: string;
  code: string;
  title: string;
  origins: string[];
  removedManually: boolean;
}

/**
 * STU-AFFECT-01 : source unique pour lire les affectations d'une société.
 * Enveloppe la vue `company_sheet_affectations` (calculée en base,
 * STU-DATA-05) jointe à master_sheets pour le code/titre — réutilisée par
 * la fiche client (STU-AFFECT-02) et la vue globale (STU-AFFECT-04), pour
 * ne jamais dupliquer la logique d'affichage.
 *
 * Deux requêtes plutôt qu'un embed PostgREST : company_sheet_affectations
 * est une vue, PostgREST ne peut pas y détecter de clé étrangère vers
 * master_sheets pour l'embed automatique (`select("...,master_sheets(...)")`
 * ne fonctionne que sur de vraies contraintes FK de table).
 */
export async function getCompanyAffectations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  companyId: string,
): Promise<CompanyAffectation[]> {
  const { data: rows, error } = await supabase
    .from("company_sheet_affectations")
    .select("master_sheet_id, origins, removed_manually")
    .eq("company_id", companyId);

  if (error || !rows || rows.length === 0) {
    return [];
  }

  const sheetIds = rows.map((row) => row.master_sheet_id as string);
  const { data: sheets } = await supabase
    .from("master_sheets")
    .select("id, code, title")
    .in("id", sheetIds);

  const sheetById = new Map((sheets ?? []).map((sheet) => [sheet.id, sheet]));

  return rows.map((row) => {
    const sheet = sheetById.get(row.master_sheet_id as string);
    return {
      masterSheetId: row.master_sheet_id as string,
      code: sheet?.code ?? "?",
      title: sheet?.title ?? "(fiche introuvable)",
      origins: (row.origins as string[]) ?? [],
      removedManually: row.removed_manually as boolean,
    };
  });
}
