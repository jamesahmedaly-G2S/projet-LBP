import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import TeamSection, { type TeamMember } from "./TeamSection";
import IdentityCard from "./IdentityCard";
import PayrollCard from "./PayrollCard";
import ToolsCard from "./ToolsCard";
import DocumentsSection from "./DocumentsSection";
import type { CompanyDocument } from "@/lib/client/company-documents";

// LBP-CLIENT-02 : "Mon équipe" [§1.3, p.9 du cahier des charges réel —
// vérifié verbatim "1.3 Mon équipe" dans le PDF]. Identité (1.3.1),
// établissements, Organisation (1.3.2, team_members), Organisation de la
// paie (1.3.3, payroll_org), Outils (1.3.4, software_stack) et Vos
// documents (1.3.5, company_documents, lecture seule) sont tous
// pleinement gérables par le client — ces tables existent déjà dans le
// schéma réel (baseline_schema_reel.sql §9.1/9.2) avec une RLS
// `company_id = current_company_id()`, jamais consommées par aucun écran
// avant ce ticket.
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
//
// Correctif (04/10/2026 bis), suite au retour de l'utilisateur ("on
// corrige de notre côté") : la carte Identité devient éditable par le
// client, alignée sur le vrai `#identEditor`
// (logo/SIRET/CCN/raison sociale/forme/effectif) -- `siret` ajouté au
// schéma réel (migration 20261004140000), `url_pictures` (déjà présente
// depuis la baseline, jamais consommée) réutilisée pour le logo.
//
// Correctif (04/10/2026 quater), même retour : "Vos documents" (1.3.5),
// dernier écart structurel, ajouté (`DocumentsSection.tsx` + table
// `company_documents`, migration 20261004150000) -- lecture seule côté
// client, écriture réservée à l'admin (`app/(studio)/clients/[id]/documents/`).
//
// Correctif (04/10/2026 quinquies), suite à un nouveau retour de
// l'utilisateur ("le contenu et la longueur à l'intérieur ça ne match
// pas avec la v9") : `IdentityForm.tsx`/`PayrollForm.tsx`/`ToolsForm.tsx`
// affichaient un formulaire en permanence déployé dans chaque carte --
// le vrai `identCard`/`paieCard`/`outilsCard` (`renderDocs()`) sont des
// cartes d'affichage **compactes** en lecture seule, l'édition se
// faisant via un bouton crayon qui ouvre un modal
// (`#identEditor`/`#paieEditor`/`#outilsEditor`). Renommés en
// `IdentityCard`/`PayrollCard`/`ToolsCard`, formulaires déplacés dans
// `ui-kit/Modal.tsx` (nouveau). `TeamSection.tsx` pareil (le vrai
// `openPersonEditor()` ouvre aussi un modal, jamais un formulaire
// inline). Icône de l'onglet "Mon entreprise" corrigée au passage
// (`Building2` -> `Users`, vrai `data-ico="users"` ~L2539) -- signalée
// par l'utilisateur dans le même retour ("l'emodjie ne correspond pas").
//
// Correctif (04/10/2026 octies), suite à un nouveau retour de
// l'utilisateur ("identité et organisation ne doivent pas être dans le
// bandeau mais un peu au-dessus") : les 4 titres (`<h2>`) étaient rendus
// **à l'intérieur** du `<Card>` (bordure/ombre), avec le contenu juste en
// dessous -- le vrai marquage a une structure différente,
// `<div class='col-block'><div class='sec-title big'>…titre…</div>` +
// `identCard`/`orgCard`/`paieCard`/`outilsCard` **en frère, pas en
// enfant** (~L10254-10260) : le titre vit au-dessus de la carte bordée,
// jamais dedans. Les 4 blocs restructurés en conséquence (titre hors du
// `<Card>`). Paragraphe "Votre organigramme." retiré au passage : absent
// du vrai marquage (`orgCard` ne contient que `#equipeHost` + le bouton
// d'ajout, aucun texte d'intro), c'était une invention.

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
    { data: documents },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("company_name, legal_form, headcount, cba, siret, url_pictures")
      .eq("id", companyId)
      .single(),
    supabase
      .from("establishments")
      .select("id, name, address")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("team_members")
      .select("id, name, job_title, department, email, phone, manager_id, avatar_index")
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
    supabase
      .from("company_documents")
      .select("id, category, name, meta, doc_date, url")
      .eq("company_id", companyId)
      .returns<CompanyDocument[]>(),
  ]);

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Mon espace</Eyebrow>
      <SectionTitle>Mon entreprise</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        Votre société, votre organisation et vos outils RH.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className={sectionHeadingClass}>📄 Identité</h2>
          <Card>
            <IdentityCard
              identity={{
                companyName: company?.company_name ?? "",
                legalForm: company?.legal_form ?? null,
                headcount: company?.headcount ?? null,
                siret: company?.siret ?? null,
                cba: company?.cba ?? null,
                logoUrl: company?.url_pictures ?? null,
              }}
              establishments={establishments ?? []}
            />
          </Card>
        </div>

        <div>
          <h2 className={sectionHeadingClass}>👥 Organisation</h2>
          <Card>
            <TeamSection members={members ?? []} />
          </Card>
        </div>

        <div>
          <h2 className={sectionHeadingClass}>⚙️ Organisation de la paie</h2>
          <Card>
            <PayrollCard
              operatingMode={payrollOrg?.operating_mode ?? null}
              providerName={payrollOrg?.provider_name ?? null}
            />
          </Card>
        </div>

        <div>
          <h2 className={sectionHeadingClass}>⚙️ Outils</h2>
          <Card>
            <ToolsCard
              payrollSoftware={softwareStack?.payroll_software ?? null}
              hris={softwareStack?.hris ?? null}
              timeManagement={softwareStack?.time_management ?? null}
              otherTools={softwareStack?.other_tools ?? null}
              hasSpecifications={softwareStack?.has_specifications ?? false}
            />
          </Card>
        </div>
      </div>

      <h2 className={sectionHeadingClass + " mt-[22px]"}>📁 Vos documents</h2>
      <DocumentsSection documents={documents ?? []} />
    </main>
  );
}
