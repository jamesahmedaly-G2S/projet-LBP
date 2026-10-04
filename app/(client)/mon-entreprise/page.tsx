import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import EstablishmentsSection from "./EstablishmentsSection";
import TeamSection, { type TeamMember } from "./TeamSection";
import PayrollForm from "./PayrollForm";
import ToolsForm from "./ToolsForm";

// LBP-CLIENT-02 : "Mon équipe" [§1.3, p.9 du cahier des charges réel —
// vérifié verbatim "1.3 Mon équipe" dans le PDF]. Identité (1.3.1) reste
// en lecture seule : companies_update_admin (RLS réelle de James) ne
// permet pas au client d'écrire directement sur `companies` — cohérent
// avec le principe déjà établi pour l'offre (le client demande, G2S
// contrôle). Établissements (1.3.1), Organisation (1.3.2, team_members),
// Organisation de la paie (1.3.3, payroll_org) et Outils (1.3.4,
// software_stack) sont pleinement gérables par le client — ces trois
// tables existent déjà dans le schéma réel (baseline_schema_reel.sql
// §9.1/9.2) avec une RLS `company_id = current_company_id()`, jamais
// consommées par aucun écran avant ce ticket. "Vos documents" (1.3.5)
// demande un vrai stockage de fichiers — non tenté ici, périmètre trop
// large pour ce seul ticket (voir tickets/LBP-CLIENT.md).
// Renommé "Mon entreprise" (cahier des charges technique V9.4, §3.3, MAJ
// 29/09/2026) — route et libellé alignés, contenu/schéma inchangés.
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("compare bien mot pour mot et taille pour taille") : les 4 en-têtes de
// bloc étaient des `<h2>` nus (text-lg font-semibold) -- revérifié contre
// `.sec-title.big` (LBP_V9.9_Studio.html, surcharge la plus tardive
// ~L2474 : font-size 23px!letter-spacing -.015em, couleur var(--titre)
// =#33405A ~L2473, le même bloc "TITRES — renforcement demandé" qui
// s'applique à SectionTitle/Eyebrow) et les icônes réelles de
// `renderDocs()` (`ico('file')`/`ico('users')`/`ico('settings')` x2) --
// jamais remarqué jusqu'ici, approximées en emoji comme pour
// AccueilContent.tsx (même convention : pas de jeu d'icônes SVG du
// prototype à notre disposition).
const sectionHeadingClass =
  "mt-[6px] mb-3 flex items-baseline gap-[10px] text-[23px] font-extrabold tracking-[-0.015em] text-[#33405A]";

// Correctif fidélité (04/10/2026), suite à un nouveau retour de
// l'utilisateur ("compare mot pour mot") : "Effectif" -> "Effectif
// global" et "Établissements" -> "Établissements ({N})" (le compte entre
// parenthèses fait partie du libellé réel, `id-lbl`, ~L10235) --
// manquaient tous les deux. Voir aussi PayrollForm.tsx/ToolsForm.tsx/
// TeamSection.tsx, corrigés dans la même passe.

export default async function MonEntreprisePage() {
  const session = await requireClient();
  const companyId = session.profile.company_id;

  if (!companyId) {
    return (
      <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
        <p className="text-sm text-danger">
          Aucune société rattachée à ce compte — contactez votre référent G2S.
        </p>
      </main>
    );
  }

  const supabase = await createClient();

  const [
    { data: company },
    { data: establishments },
    { data: members },
    { data: payrollOrg },
    { data: softwareStack },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("company_name, legal_form, headcount, cba")
      .eq("id", companyId)
      .single(),
    supabase
      .from("establishments")
      .select("id, name, address")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("team_members")
      .select("id, name, job_title, department, email, phone, manager_id")
      .eq("company_id", companyId)
      .order("name")
      .returns<TeamMember[]>(),
    supabase
      .from("payroll_org")
      .select("operating_mode, provider_name")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("software_stack")
      .select("payroll_software, hris, time_management, other_tools, has_specifications")
      .eq("company_id", companyId)
      .maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Mon espace</Eyebrow>
      <SectionTitle>Mon entreprise</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        Votre société, votre organisation et vos outils RH.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className={sectionHeadingClass}>📄 Identité</h2>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div>
              <dt className="text-muted">Raison sociale</dt>
              <dd className="text-ink">{company?.company_name ?? "—"}</dd>
              {company?.cba && <dd className="text-muted">{company.cba}</dd>}
            </div>
            <div>
              <dt className="text-muted">Forme</dt>
              <dd className="text-ink">{company?.legal_form ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Effectif global</dt>
              <dd className="text-ink">{company?.headcount ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">
            Ces informations sont gérées par votre référent G2S. Les établissements ci-dessous
            restent modifiables directement.
          </p>
          <h3 className="mt-4 text-sm font-semibold text-ink">
            Établissements ({establishments?.length ?? 0})
          </h3>
          <div className="mt-2">
            <EstablishmentsSection establishments={establishments ?? []} />
          </div>
        </Card>

        <Card>
          <h2 className={sectionHeadingClass}>👥 Organisation</h2>
          <p className="mt-1 text-xs text-muted">Votre organigramme.</p>
          <div className="mt-3">
            <TeamSection members={members ?? []} />
          </div>
        </Card>

        <Card>
          <h2 className={sectionHeadingClass}>⚙️ Organisation de la paie</h2>
          <div className="mt-3">
            <PayrollForm
              operatingMode={payrollOrg?.operating_mode ?? null}
              providerName={payrollOrg?.provider_name ?? null}
            />
          </div>
        </Card>

        <Card>
          <h2 className={sectionHeadingClass}>⚙️ Outils</h2>
          <div className="mt-3">
            <ToolsForm
              payrollSoftware={softwareStack?.payroll_software ?? null}
              hris={softwareStack?.hris ?? null}
              timeManagement={softwareStack?.time_management ?? null}
              otherTools={softwareStack?.other_tools ?? null}
              hasSpecifications={softwareStack?.has_specifications ?? false}
            />
          </div>
        </Card>
      </div>
    </main>
  );
}
