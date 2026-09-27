import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import CcnSection from "./CcnSection";
import EntretienSuiviBlock from "./EntretienSuiviBlock";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { LinkButton } from "@/ui-kit/LinkButton";
import { AffectationList } from "../../_components/AffectationList";
import { AddOverrideForm } from "./AddOverrideForm";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { getPendingSheetUpdates, getCompanySpecificContent } from "@/lib/studio/client-fiche";
import { summarizeEntretiens, type InterviewRow } from "@/lib/studio/entretien";
import { getWorkflowStatusLabel, getWorkflowStatusTone } from "@/lib/studio/workflow-status";
import StartInterviewButton from "./entretien/StartInterviewButton";

// STU-CLIENT-02 : fiche client complète (§5.2) — identité, établissements,
// offre, utilisateurs, CCN (STU-CCN-02), questionnaire, fiches affectées
// (STU-AFFECT-02/03), contenus spécifiques, mises à jour en attente,
// historique (page séparée, comme `stOpenHisto()`) et "Suivi annuel"
// (seuils centralisés dans lib/studio/settings.ts, jamais recopiés ici).
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name, offer_tier, published_at, created_at")
    .eq("id", id)
    .single();

  if (!company) {
    notFound();
  }

  const [
    { data: offer },
    { data: establishments },
    { data: users },
    { data: catalog },
    { data: companyCcns },
    affectations,
    { data: publishedSheets },
    pendingUpdates,
    specificContent,
    { data: interviews },
    { data: lastAnswer },
  ] = await Promise.all([
    supabase.from("offer_tiers").select("name").eq("tier_level", company.offer_tier).single(),
    supabase.from("establishments").select("id, name, address").eq("company_id", id).order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, job_title, status")
      .eq("company_id", id)
      .eq("role", "client"),
    supabase.from("ccn_catalog").select("idcc, name").order("name"),
    supabase.from("company_ccns").select("ccn_idcc").eq("company_id", id),
    getCompanyAffectations(supabase, id),
    supabase
      .from("master_sheets")
      .select("id, code, title")
      .eq("status", "published")
      .order("title"),
    getPendingSheetUpdates(supabase, id),
    getCompanySpecificContent(supabase, id),
    supabase
      .from("company_interviews")
      .select("status, planned_at, completed_at")
      .eq("company_id", id)
      .returns<InterviewRow[]>(),
    supabase
      .from("company_questionnaire_answers")
      .select("answered_at")
      .eq("company_id", id)
      .order("answered_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // "Disponible pour ajout manuel" = pas encore d'override manuel actif.
  // L'origine "base" s'applique à toute société pour toute fiche publiée
  // (STU-DATA-05) : filtrer sur l'ensemble des origines viderait la liste en
  // permanence. Une fiche déjà affectée automatiquement reste ajoutable —
  // le seed le démontre (REM-DEMO-004 cumule base + ccn + manual pour ALPHA).
  const manuallyAddedIds = new Set(
    affectations.filter((a) => a.origins.includes("manual")).map((a) => a.masterSheetId),
  );
  const availableSheets = (publishedSheets ?? []).filter(
    (sheet) => !manuallyAddedIds.has(sheet.id),
  );

  const entretienSummary = summarizeEntretiens(interviews ?? []);
  const activeAffectationCount = affectations.filter((a) => !a.removedManually).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
          <Badge tone="blue">{offer?.name ?? `Palier ${company.offer_tier}`}</Badge>
          {!company.published_at && <Badge tone="amber">Non publié</Badge>}
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/clients/${id}/historique`} variant="secondary" className="text-xs">
            Consulter l&apos;historique
          </LinkButton>
          <LinkButton href={`/clients/${id}/questionnaire`} variant="secondary" className="text-xs">
            Ouvrir le questionnaire
          </LinkButton>
          <LinkButton href={`/clients/${id}/vue-client`} variant="secondary" className="text-xs">
            Accéder au LBP du client
          </LinkButton>
          <StartInterviewButton companyId={id} />
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Suivi annuel</h2>
        <EntretienSuiviBlock summary={entretienSummary} />
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">Profil &amp; abonnement</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-studio-navy">
            <li>
              {(establishments ?? []).length} établissement
              {(establishments ?? []).length > 1 ? "s" : ""}
            </li>
            <li>
              {(companyCcns ?? []).length} CCN applicable
              {(companyCcns ?? []).length > 1 ? "s" : ""}
            </li>
            <li>
              {(users ?? []).length} utilisateur{(users ?? []).length > 1 ? "s" : ""} autorisé
              {(users ?? []).length > 1 ? "s" : ""}
            </li>
            <li>
              Questionnaire :{" "}
              {lastAnswer?.answered_at
                ? `dernière réponse le ${new Date(lastAnswer.answered_at).toLocaleDateString("fr-FR")}`
                : "aucune réponse enregistrée"}
            </li>
            <li>{activeAffectationCount} fiches affectées</li>
            <li>
              {specificContent.length} contenu{specificContent.length > 1 ? "s" : ""} spécifique
              {specificContent.length > 1 ? "s" : ""} entreprise
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">Établissements</h2>
          {(establishments ?? []).length === 0 ? (
            <p className="text-sm text-studio-muted">Aucun établissement renseigné.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {(establishments ?? []).map((e) => (
                <li key={e.id}>
                  <span className="font-medium text-studio-navy">{e.name}</span>
                  {e.address && <span className="text-studio-muted"> — {e.address}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Utilisateurs</h2>
        {(users ?? []).length === 0 ? (
          <p className="text-sm text-studio-muted">Aucun utilisateur créé pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {(users ?? []).map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <span>
                  <span className="font-medium text-studio-navy">{u.full_name}</span>
                  {u.job_title && <span className="text-studio-muted"> — {u.job_title}</span>}
                </span>
                <Badge tone={u.status === "active" ? "green" : "neutral"}>{u.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Conventions collectives</h2>
        <CcnSection
          companyId={company.id}
          catalog={catalog ?? []}
          initialSelected={(companyCcns ?? []).map((row) => row.ccn_idcc)}
        />
      </Card>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">Mises à jour en attente</h2>
          {pendingUpdates.length === 0 ? (
            <p className="text-sm text-studio-muted">
              Aucune mise à jour en attente pour ce client.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {pendingUpdates.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <span>
                    {u.title} <span className="text-xs text-studio-muted">v{u.version}</span>
                  </span>
                  <Badge tone={getWorkflowStatusTone(u.status)}>
                    {getWorkflowStatusLabel(u.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">
            Contenus spécifiques entreprise
          </h2>
          {specificContent.length === 0 ? (
            <p className="text-sm text-studio-muted">Aucun contenu spécifique.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {specificContent.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span>
                    {c.title} <span className="text-xs text-studio-muted">v{c.version}</span>
                  </span>
                  <Badge tone={getWorkflowStatusTone(c.status)}>
                    {getWorkflowStatusLabel(c.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">
          Fiches affectées — pourquoi ces fiches sont présentes
        </h2>
        <AffectationList affectations={affectations} companyId={company.id} />
        <div className="mt-4 border-t border-studio-line pt-4">
          <AddOverrideForm companyId={company.id} availableSheets={availableSheets} />
        </div>
      </Card>
    </main>
  );
}
