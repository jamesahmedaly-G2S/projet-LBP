"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { buildPlaceholderContent, type SheetContent } from "@/lib/studio/placeholder-content";
import { isValidTransition } from "@/lib/studio/workflow-transitions";
import type { WorkflowStatus } from "@/lib/studio/workflow-status";
import { getImpactedCompanies } from "@/lib/studio/publication-impact";

// STU-REF-02 : création d'une fiche maître (métadonnées + première version
// "rg" en brouillon, contenu factice) et édition de ce contenu.

export async function createMasterSheet(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const familyId = formData.get("family_id");
  const themeId = formData.get("theme_id");
  const subthemeId = formData.get("subtheme_id");
  const title = formData.get("title");
  const tagsRaw = formData.get("tags");

  if (
    typeof familyId !== "string" ||
    typeof themeId !== "string" ||
    typeof title !== "string" ||
    !title.trim()
  ) {
    return "Famille, thème et titre sont obligatoires.";
  }

  const tags =
    typeof tagsRaw === "string" && tagsRaw.trim()
      ? tagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  const supabase = await createClient();

  // Identifiant stable derive du theme (code du theme + rang) - simplification
  // volontaire pour un outil interne a faible concurrence : en cas de
  // collision rarissime, la contrainte unique sur `code` fait echouer
  // l'insertion plutot que de corrompre des donnees.
  const { count } = await supabase
    .from("master_sheets")
    .select("id", { count: "exact", head: true })
    .eq("theme_id", themeId);

  const { data: theme } = await supabase
    .from("master_themes")
    .select("code")
    .eq("id", themeId)
    .single();
  const sequence = String((count ?? 0) + 1).padStart(3, "0");
  const code = `${theme?.code ?? "THEME"}-${sequence}`;

  const { data: sheet, error: sheetError } = await supabase
    .from("master_sheets")
    .insert({
      code,
      family_id: familyId,
      theme_id: themeId,
      subtheme_id: typeof subthemeId === "string" && subthemeId ? subthemeId : null,
      title: title.trim(),
      tags,
      status: "draft",
    })
    .select("id")
    .single();

  if (sheetError || !sheet) {
    return `Erreur lors de la création : ${sheetError?.message ?? "inconnue"}`;
  }

  const { error: versionError } = await supabase.from("sheet_versions").insert({
    master_sheet_id: sheet.id,
    layer_kind: "rg",
    version: 1,
    status: "draft",
    content: buildPlaceholderContent(title.trim()),
    author_id: session.userId,
  });

  if (versionError) {
    return `Fiche créée mais erreur sur la version initiale : ${versionError.message}`;
  }

  redirect(`/referentiel/${sheet.id}`);
}

export async function updateSheetContent(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const versionId = formData.get("version_id");
  if (typeof versionId !== "string") {
    return "Version introuvable.";
  }

  const supabase = await createClient();

  // STU-WORKFLOW-04 : une version déjà diffusée ne doit plus jamais changer
  // de contenu en place — sinon "consulter le contenu exact de la version
  // précédente" (§ scénario E) deviendrait faux. Vérifié côté serveur, pas
  // seulement en cachant le formulaire (createNewVersion() est le seul
  // chemin pour modifier après publication).
  const { data: existing } = await supabase
    .from("sheet_versions")
    .select("status")
    .eq("id", versionId)
    .single();

  if (existing && ["published", "historized", "archived"].includes(existing.status)) {
    return "Cette version est déjà diffusée : créez une nouvelle version pour la modifier.";
  }

  const content: SheetContent = {
    essentiel: String(formData.get("essentiel") ?? ""),
    comprendre: String(formData.get("comprendre") ?? ""),
    maitriser: String(formData.get("maitriser") ?? ""),
    application: String(formData.get("application") ?? ""),
    vigilance: String(formData.get("vigilance") ?? ""),
  };

  const { error } = await supabase.from("sheet_versions").update({ content }).eq("id", versionId);

  if (error) {
    return `Erreur lors de l'enregistrement : ${error.message}`;
  }

  return "Enregistré.";
}

// STU-WORKFLOW-04 : seul moyen de faire évoluer le contenu d'une fiche déjà
// publiée — copie le contenu de la version courante comme point de départ
// (jamais de retour à la page blanche), nouveau numéro de version, statut
// draft. Ne touche jamais l'ancienne version : c'est elle que l'historique
// affichera comme "version précédente".
// STU-VEILLE-03 : `legal_monitoring_id` optionnel — quand l'appel vient
// d'une entrée de veille qualifiée, trace l'origine sur la version créée
// (traçabilité de bout en bout, y compris une fois publiée) et redirige
// directement vers la fiche plutôt que de revenir sur la veille.
export async function createNewVersion(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const masterSheetId = formData.get("master_sheet_id");
  const legalMonitoringId = formData.get("legal_monitoring_id");
  if (typeof masterSheetId !== "string") {
    return "Fiche introuvable.";
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("sheet_versions")
    .select("version, content")
    .eq("master_sheet_id", masterSheetId)
    .eq("layer_kind", "rg")
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !current) {
    return "Version courante introuvable.";
  }

  const { error: insertError } = await supabase.from("sheet_versions").insert({
    master_sheet_id: masterSheetId,
    layer_kind: "rg",
    version: current.version + 1,
    status: "draft",
    content: current.content,
    author_id: session.userId,
    legal_monitoring_id:
      typeof legalMonitoringId === "string" && legalMonitoringId ? legalMonitoringId : null,
  });

  if (insertError) {
    return `Erreur lors de la création de la nouvelle version : ${insertError.message}`;
  }

  await supabase.from("master_sheets").update({ status: "draft" }).eq("id", masterSheetId);

  revalidatePath(`/referentiel/${masterSheetId}`);
  revalidatePath(`/referentiel/${masterSheetId}/historique`);

  if (typeof legalMonitoringId === "string" && legalMonitoringId) {
    redirect(`/referentiel/${masterSheetId}`);
  }
  return null;
}

// STU-REF-03 : renommer une fiche ne touche jamais son `code` (identifiant
// stable) - master_question_impacts et company_sheet_overrides référencent
// l'id/le code, jamais le titre, donc aucune affectation n'est cassée par
// un renommage.
export async function renameMasterSheet(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const sheetId = formData.get("sheet_id");
  const title = formData.get("title");

  if (typeof sheetId !== "string" || typeof title !== "string" || !title.trim()) {
    return "Titre requis.";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("master_sheets")
    .update({ title: title.trim() })
    .eq("id", sheetId);

  if (error) {
    return `Erreur lors du renommage : ${error.message}`;
  }

  return "Titre mis à jour.";
}

// STU-WORKFLOW-01 : applique une transition de statut sur une version, en
// respectant le graphe défini dans lib/studio/workflow-transitions.ts.
// Publier bascule d'abord l'éventuelle version publiée de la même
// couche/clé vers "historized" (jamais deux versions publiées en même
// temps pour une même clé — cohérent avec les index uniques partiels de
// STU-DATA-02), puis tient à jour master_sheets.status pour la couche rg
// (dénormalisation documentée dans STU-DATA-01). `motif` (colonne
// existante depuis STU-DATA-02, jusqu'ici jamais écrite) est optionnel :
// WorkflowActions (fiche) ne le fournit pas, l'écran de contrôle
// (STU-WORKFLOW-02) l'exige côté formulaire.
export async function transitionSheetVersion(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const versionId = formData.get("version_id");
  const target = formData.get("target_status");
  const motif = formData.get("motif");
  const scheduledAtRaw = formData.get("scheduled_at");

  if (typeof versionId !== "string" || typeof target !== "string") {
    return "Version ou statut cible manquant.";
  }
  const targetStatus = target as WorkflowStatus;

  let scheduledAt: string | null = null;
  if (targetStatus === "scheduled") {
    if (typeof scheduledAtRaw !== "string" || !scheduledAtRaw) {
      return "Une date de programmation est requise.";
    }
    const parsed = new Date(scheduledAtRaw);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
      return "La date de programmation doit être dans le futur.";
    }
    scheduledAt = parsed.toISOString();
  }

  const supabase = await createClient();

  const { data: version, error: fetchError } = await supabase
    .from("sheet_versions")
    .select("id, master_sheet_id, layer_kind, ccn_idcc, company_id, status, legal_monitoring_id")
    .eq("id", versionId)
    .single();

  if (fetchError || !version) {
    return "Version introuvable.";
  }

  if (!isValidTransition(version.status as WorkflowStatus, targetStatus)) {
    return `Transition invalide : "${version.status}" → "${targetStatus}" n'est pas autorisée.`;
  }

  if (targetStatus === "published") {
    let siblingQuery = supabase
      .from("sheet_versions")
      .select("id")
      .eq("master_sheet_id", version.master_sheet_id)
      .eq("layer_kind", version.layer_kind)
      .eq("status", "published")
      .neq("id", version.id);

    if (version.layer_kind === "ccn") {
      siblingQuery = siblingQuery.eq("ccn_idcc", version.ccn_idcc);
    } else if (version.layer_kind === "ent" || version.layer_kind === "proc") {
      siblingQuery = siblingQuery.eq("company_id", version.company_id);
    }

    const { data: sibling } = await siblingQuery.maybeSingle();

    if (sibling) {
      const { error: historizeError } = await supabase
        .from("sheet_versions")
        .update({ status: "historized" })
        .eq("id", sibling.id);
      if (historizeError) {
        return `Erreur lors de l'historisation de l'ancienne version : ${historizeError.message}`;
      }
    }
  }

  const { error: updateError } = await supabase
    .from("sheet_versions")
    .update({
      status: targetStatus,
      published_at: targetStatus === "published" ? new Date().toISOString() : undefined,
      scheduled_at: targetStatus === "scheduled" ? scheduledAt : undefined,
      ...(typeof motif === "string" && motif.trim() ? { motif: motif.trim() } : {}),
    })
    .eq("id", version.id);

  if (updateError) {
    return `Erreur lors de la transition : ${updateError.message}`;
  }

  if (version.layer_kind === "rg") {
    await supabase
      .from("master_sheets")
      .update({ status: targetStatus })
      .eq("id", version.master_sheet_id);
  }

  // STU-WORKFLOW-03 : "qui a reçu quoi" recalculé au moment réel de la
  // publication (jamais transmis par le client) — couvre aussi bien
  // valid -> published (immédiate) que scheduled -> published (échéance
  // atteinte), un seul endroit qui écrit sheet_version_recipients.
  if (targetStatus === "published") {
    const impacted = await getImpactedCompanies(supabase, {
      layerKind: version.layer_kind,
      ccnIdcc: version.ccn_idcc,
      companyId: version.company_id,
    });
    if (impacted.length > 0) {
      await supabase.from("sheet_version_recipients").upsert(
        impacted.map((company) => ({ sheet_version_id: version.id, company_id: company.id })),
        { onConflict: "sheet_version_id,company_id" },
      );
    }

    // STU-VEILLE-03 : la veille d'origine ne passe à "traitée" qu'à la
    // publication réelle, jamais à la préparation de la version (§10 —
    // "une nouvelle version est préparée sans toucher à la version
    // publiée", donc pas de statut final avant que ce soit effectif).
    if (version.legal_monitoring_id) {
      await supabase
        .from("legal_monitoring")
        .update({ status: "processed" })
        .eq("id", version.legal_monitoring_id);
      revalidatePath(`/veille/${version.legal_monitoring_id}`);
    }
  }

  revalidatePath(`/referentiel/${version.master_sheet_id}`);
  revalidatePath("/referentiel/controle");
  return null;
}

// STU-CCN-03 (scénario C — "modifier uniquement la couche Syntec... sans
// impacter la couche rg") : première version d'une couche CCN pour cette
// fiche. Cycle de statuts totalement indépendant de la couche rg —
// transitionSheetVersion() ne synchronise master_sheets.status que pour
// layer_kind==='rg' (déjà vérifié plus haut dans ce fichier), donc rien de
// spécifique à faire ici pour respecter ce critère d'acceptation.
export async function createCcnLayer(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const masterSheetId = formData.get("master_sheet_id");
  const ccnIdcc = formData.get("ccn_idcc");
  if (typeof masterSheetId !== "string" || typeof ccnIdcc !== "string" || !ccnIdcc) {
    return "Fiche et CCN sont obligatoires.";
  }

  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("master_sheets")
    .select("title")
    .eq("id", masterSheetId)
    .single();

  const { error } = await supabase.from("sheet_versions").insert({
    master_sheet_id: masterSheetId,
    layer_kind: "ccn",
    ccn_idcc: ccnIdcc,
    version: 1,
    status: "draft",
    content: buildPlaceholderContent(sheet?.title ?? ""),
    author_id: session.userId,
  });

  if (error) {
    return `Erreur lors de la création de la couche CCN : ${error.message}`;
  }

  revalidatePath(`/referentiel/${masterSheetId}`);
  return null;
}

// Pendant de createNewVersion() pour une couche CCN — jamais de mise à
// jour de master_sheets.status ici (réservé à la couche rg).
export async function createNewCcnVersion(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await requireAdmin();

  const masterSheetId = formData.get("master_sheet_id");
  const ccnIdcc = formData.get("ccn_idcc");
  if (typeof masterSheetId !== "string" || typeof ccnIdcc !== "string" || !ccnIdcc) {
    return "Fiche et CCN sont obligatoires.";
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("sheet_versions")
    .select("version, content")
    .eq("master_sheet_id", masterSheetId)
    .eq("layer_kind", "ccn")
    .eq("ccn_idcc", ccnIdcc)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !current) {
    return "Version courante introuvable.";
  }

  const { error: insertError } = await supabase.from("sheet_versions").insert({
    master_sheet_id: masterSheetId,
    layer_kind: "ccn",
    ccn_idcc: ccnIdcc,
    version: current.version + 1,
    status: "draft",
    content: current.content,
    author_id: session.userId,
  });

  if (insertError) {
    return `Erreur lors de la création de la nouvelle version : ${insertError.message}`;
  }

  revalidatePath(`/referentiel/${masterSheetId}`);
  return null;
}
