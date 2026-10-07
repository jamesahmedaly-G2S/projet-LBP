"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Settings,
  TriangleAlert,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { SheetContent } from "@/lib/studio/placeholder-content";

// Les 6 rubriques d'une fiche (LBP_SPEC + lbpCardsHTML()/lbpSectionHTML(),
// LBP_V9.9_Studio.html ~L10831-10990) : une grille de 6 cartes cliquables
// (`.lbp-cards .col`), puis le bloc de la rubrique sélectionnée
// (`.lbp-block`). Valeurs mesurées sur le rendu réel du prototype
// (getComputedStyle) ; trios fond/texte/bordure = design.md §2.3.
type RubriqueId = "essentiel" | "comprendre" | "maitriser" | "application" | "vigilance" | "quiz";

interface Rubrique {
  id: RubriqueId;
  Icon: LucideIcon;
  label: string;
  leg: string;
  pub: string;
  placeholder: string;
  bg: string;
  tx: string;
  bd: string;
}

const RUBRIQUES: Rubrique[] = [
  {
    id: "essentiel",
    Icon: Zap,
    label: "L'essentiel à retenir",
    leg: "Accédez immédiatement aux informations clés et à la réponse essentielle sur le sujet.",
    pub: "Direction · DRH · Responsable Paie · Gestionnaire Paie",
    placeholder: "Définition, règle essentielle, chiffres et seuils à renseigner.",
    bg: "#f5e6eb",
    tx: "#670626",
    bd: "#d9a7b7",
  },
  {
    id: "comprendre",
    Icon: BookOpen,
    label: "Comprendre la règle",
    leg: "Comprenez le cadre applicable en croisant la réglementation, votre convention collective et vos accords d'entreprise.",
    pub: "DRH · Responsable Paie · Gestionnaire Paie",
    placeholder: "À renseigner.",
    bg: "#eaecef",
    tx: "#364054",
    bd: "#b9c0cc",
  },
  {
    id: "maitriser",
    Icon: Search,
    label: "Maîtriser la règle en détail",
    leg: "Approfondissez chaque composante de la règle pour en maîtriser tous les aspects techniques et opérationnels.",
    pub: "Responsable Paie · Gestionnaire Paie",
    placeholder:
      "Règles de calcul, régime social, régime fiscal, bulletin de paie, exemples, justificatifs et documents opposables à renseigner.",
    bg: "#efe7e1",
    tx: "#3e0417",
    bd: "#c6bfc3",
  },
  {
    id: "application",
    Icon: Settings,
    label: "Comment l'appliquer concrètement en paie",
    leg: "Sachez exactement comment traiter le sujet dans votre environnement paie : paramétrage, calcul, DSN, justificatifs, procédures et spécificités internes.",
    pub: "Responsable Paie · Gestionnaire Paie",
    placeholder:
      "Paramétrage, calcul, DSN, justificatifs, procédure interne et spécificités à renseigner.",
    bg: "#eaf7f6",
    tx: "#0b6e6c",
    bd: "#9ed8d6",
  },
  {
    id: "vigilance",
    Icon: TriangleAlert,
    label: "Points de vigilance",
    leg: "Repérez les erreurs fréquentes, les situations à risque et les contrôles à effectuer pour sécuriser vos pratiques.",
    pub: "DRH · Responsable Paie · Gestionnaire Paie",
    placeholder:
      "Erreurs fréquentes, situations à risque et contrôles à effectuer avant validation de la paie.",
    bg: "#fdeeef",
    tx: "#a3262c",
    bd: "#f2b5b8",
  },
  {
    id: "quiz",
    Icon: Trophy,
    label: "Quiz",
    leg: "Testez vos connaissances sur le sujet, mesurez votre niveau de maîtrise et identifiez les points à approfondir.",
    pub: "Tous les utilisateurs, et notamment les équipes RH et Paie",
    placeholder: "Quiz à rédiger.",
    bg: "#fdf8e8",
    tx: "#7a5a00",
    bd: "#f2d57a",
  },
];

export interface FicheLayer {
  id: string;
  label: string;
  content: SheetContent;
}

export default function FicheRubriques({
  rg,
  overlays,
  quiz,
}: {
  rg: SheetContent | null;
  overlays: FicheLayer[];
  quiz: { id: string; title: string } | null;
}) {
  const [selected, setSelected] = useState<RubriqueId>("essentiel");
  const r = RUBRIQUES.find((x) => x.id === selected) ?? RUBRIQUES[0];

  return (
    <>
      <div className="mt-4 mb-[22px] grid grid-cols-3 items-stretch gap-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
        {RUBRIQUES.map((rub) => {
          const sel = rub.id === selected;
          return (
            <button
              key={rub.id}
              type="button"
              aria-pressed={sel}
              onClick={() => setSelected(rub.id)}
              style={
                sel
                  ? { background: rub.bg, boxShadow: `inset 0 0 0 1.5px ${rub.bd}` }
                  : { borderTopColor: rub.bd }
              }
              className={`relative flex min-h-[118px] w-full cursor-pointer flex-col items-start justify-center gap-[7px] rounded-[14px] border border-border p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)] ${
                sel ? "" : "border-t-4 bg-white"
              }`}
            >
              <span className="block leading-[0]" style={{ color: rub.tx }}>
                <rub.Icon size={20} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="block text-[13.5px] leading-[1.28] font-extrabold tracking-[-0.005em] text-ink">
                {rub.label}
              </span>
              <span className="block text-[10.5px] leading-[1.35] text-[#6b656b]">{rub.pub}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border px-6 py-5" style={{ background: r.bg, borderColor: r.bd }}>
        <div className="mb-4 flex items-start gap-3 border-b border-black/[0.07] pb-[14px]">
          <span className="mt-0.5 leading-[0]" style={{ color: r.tx }}>
            <r.Icon size={20} strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <h2
              className="mb-1 text-[18px] leading-[1.5] font-extrabold tracking-[-0.02em]"
              style={{ color: r.tx }}
            >
              {r.label}
            </h2>
            <p className="mb-[3px] text-[13px] leading-[1.5] text-ink opacity-85">{r.leg}</p>
            <p className="text-[11px] text-[#6b656b] italic">Public concerné : {r.pub}</p>
          </div>
        </div>
        <div className="rounded-xl bg-white px-5 py-[18px] text-[14px] leading-[1.7] text-ink">
          {r.id === "quiz" ? (
            quiz ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>{quiz.title}</p>
                <Link
                  href={`/mes-quiz/${quiz.id}`}
                  className="inline-flex items-center gap-[7px] rounded-full bg-primary px-[18px] py-[9px] text-[12.5px] leading-none font-bold whitespace-nowrap text-white transition duration-150 hover:-translate-y-px hover:bg-primary-hover"
                >
                  Faire le quiz →
                </Link>
              </div>
            ) : (
              <Placeholder text={r.placeholder} />
            )
          ) : (
            <RubriqueBody rubrique={r} rg={rg} overlays={overlays} />
          )}
        </div>
      </div>
    </>
  );
}

function Placeholder({ text }: { text: string }) {
  return <p className="text-[#6b656b] italic">{text}</p>;
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n+/).map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </>
  );
}

// Avec des couches superposées (CCN, entreprise, procédure), même
// présentation en niveaux numérotés que la rubrique "Comprendre" du
// prototype (`.lbp-niv`, ~L1137-1142).
function RubriqueBody({
  rubrique,
  rg,
  overlays,
}: {
  rubrique: Rubrique;
  rg: SheetContent | null;
  overlays: FicheLayer[];
}) {
  const key = rubrique.id as keyof SheetContent;
  const base = rg?.[key]?.trim() ?? "";
  const extra = overlays.filter((l) => l.content?.[key]?.trim());

  if (extra.length === 0) {
    return base ? <Paragraphs text={base} /> : <Placeholder text={rubrique.placeholder} />;
  }

  const levels = [
    { id: "rg", label: "La réglementation / la loi", text: base },
    ...extra.map((l) => ({ id: l.id, label: l.label, text: l.content[key].trim() })),
  ];
  return (
    <>
      {levels.map((lvl, i) => (
        <div key={lvl.id} className="mb-[18px] border-l-[3px] border-[#b9c0cc] pl-[14px] last:mb-0">
          <div className="mb-1.5 flex items-start gap-2.5">
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#364054] text-[11px] font-extrabold text-white">
              {i + 1}
            </span>
            <b className="block text-[14px] text-ink">{lvl.label}</b>
          </div>
          <div className="pl-8 text-[13.5px]">
            {lvl.text ? <Paragraphs text={lvl.text} /> : <Placeholder text="À renseigner." />}
          </div>
        </div>
      ))}
    </>
  );
}
