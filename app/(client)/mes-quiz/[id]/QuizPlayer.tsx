"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Clock, Check, X, Trophy } from "lucide-react";
import type { QuizQuestion } from "@/lib/studio/parse-quiz";
import { submitQuizScore } from "../actions";

// LBP-CLIENT-06 (correctif) : le lecteur construit initialement montrait
// bon/mauvais + explication immédiatement après chaque question — l'exact
// inverse du vrai lecteur de référence (LBP_V6_Studio.html, lignes
// 5517-5617, commentaire du fichier lui-même : "AUCUN retour sur la
// justesse de la réponse pendant le quiz ; résultat complet + explication
// de chaque question à la fin"). Confirmé aussi dans les CR de réunion
// (Nouveau dossier/compte_rendu_de_réunion, CR 10-09 : "prévoir un temps
// limité pour répondre à chaque question" ; CR 17-09 : chronomètre déjà
// acté). Durée réelle : QUIZ_TIME_PER_QUESTION=25 dans le prototype — pas
// 20 comme rapporté en conversation, corrigé sur la base du code source
// réel plutôt que du souvenir.
const QUIZ_TIME_PER_QUESTION = 25;

// Correctif fidélité (06/10/2026), mesuré sur le rendu de la maquette
// (startQuizModule(0), qzBegin() puis getComputedStyle ; CSS ~L1002-1092) :
// le lecteur est un `.pane.quizplay` (blanc, radius 18, padding 26px 28px,
// --shadow-sm) qui contient lui-même un encadré `.qz-start`/`.qz-run`/
// `.qz-end` (bordure --ligne, radius 16) -- deux niveaux de cadre, pas une
// seule Card générique. Écrans de début et de fin centrés avec icône
// trophée 34px ; chronomètre en pilule crème/framboise ; options en lignes
// `.qz-opt` (bordure 1.5px, radius 11, padding 13px 16px, puce ronde
// 16px, sélection = bordure + puce carbone) ; bouton à gauche PUIS mention
// "Vos résultats…" en italique (l'inverse de l'ordre précédent) ; détail
// des résultats en `.qz-res` (filet gauche 4px : carbone si juste, #EAAE18
// sinon). "Demander une formation" (openFormation() du prototype) non
// repris : aucun circuit de demande de formation côté appli à ce jour --
// jamais simulé.
const pane =
  "rounded-[18px] border border-border bg-surface px-7 py-[26px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]";
const innerBox = "rounded-2xl border border-border bg-surface";
const btnPrimary =
  "inline-flex items-center gap-[7px] rounded-full bg-primary px-[18px] py-[9px] text-[12.5px] leading-none font-bold whitespace-nowrap text-white transition hover:-translate-y-px hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
const btnLine =
  "inline-flex items-center gap-[7px] rounded-full border-[1.5px] border-primary bg-white px-[18px] py-[9px] text-[12.5px] leading-none font-bold whitespace-nowrap text-primary transition hover:bg-primary hover:text-white";
const qzLab = "text-[11px] font-extrabold tracking-[0.03em] text-muted uppercase";

interface Answer {
  pickedIndex: number | null;
  timeout: boolean;
}

export default function QuizPlayer({
  quizId,
  title,
  questions,
}: {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
}) {
  const [phase, setPhase] = useState<"intro" | "playing" | "finished">("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_PER_QUESTION);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedRef = useRef(false);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      validate(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, index]);

  function begin() {
    setIndex(0);
    setAnswers([]);
    setPicked(null);
    setTimeLeft(QUIZ_TIME_PER_QUESTION);
    setPhase("playing");
  }

  function validate(timeout = false) {
    const next: Answer = { pickedIndex: timeout ? null : picked, timeout };
    const nextAnswers = [...answers, next];
    setAnswers(nextAnswers);

    if (isLast) {
      finish(nextAnswers);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setTimeLeft(QUIZ_TIME_PER_QUESTION);
  }

  function finish(finalAnswers: Answer[]) {
    setPhase("finished");
    if (savedRef.current) return;
    savedRef.current = true;
    const correct = finalAnswers.filter(
      (a, i) => a.pickedIndex !== null && questions[i].opts[a.pickedIndex]?.correct,
    ).length;
    const score = (correct / questions.length) * 100;
    startTransition(async () => {
      setSaveError(await submitQuizScore(quizId, score));
    });
  }

  if (phase === "intro") {
    return (
      <div className={pane}>
        <div className={`${innerBox} px-6 py-[30px] text-center`}>
          <div className="mb-2.5 text-ink">
            <Trophy className="inline-block h-[34px] w-[34px]" aria-hidden="true" />
          </div>
          <h2 className="mb-2 text-[19px] font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
          <p className="mb-2 text-[13.5px] text-muted">
            {questions.length} question{questions.length > 1 ? "s" : ""} · {QUIZ_TIME_PER_QUESTION}{" "}
            secondes par question.
          </p>
          <p className="mx-auto mb-2 max-w-[440px] text-[13.5px] text-muted italic">
            Les questions s&apos;affichent une par une. Vous ne verrez vos résultats et les
            explications qu&apos;à la fin du quiz. Une question sans réponse dans le temps imparti
            est comptée comme incorrecte.
          </p>
          <button type="button" className={btnPrimary} onClick={begin}>
            Commencer le quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === "finished") {
    const correct = answers.filter(
      (a, i) => a.pickedIndex !== null && questions[i].opts[a.pickedIndex]?.correct,
    ).length;
    const pct = Math.round((correct / questions.length) * 100);

    return (
      <div className={pane}>
        <div className={`${innerBox} px-6 py-[30px] text-center`}>
          <div className="mb-2.5 text-ink">
            <Trophy className="inline-block h-[34px] w-[34px]" aria-hidden="true" />
          </div>
          <p className="text-[34px] font-extrabold text-ink">
            {correct} / {questions.length}
          </p>
          <p className="mb-2.5 text-sm text-muted">{pct} % de bonnes réponses</p>
          <p
            className={`mx-auto mb-1.5 max-w-[520px] rounded-[10px] px-3.5 py-2.5 text-[13.5px] ${
              pct < 70 ? "bg-[#FDF8E8] text-[#7A5A00]" : "bg-[#F5F0EC] text-primary"
            }`}
          >
            {pct < 70
              ? "Votre score indique que ce sujet mérite d'être approfondi. Nous vous recommandons une formation ciblée."
              : "Beau score : vous maîtrisez bien ce sujet."}
          </p>

          <div className="mx-auto mt-4 flex max-w-[520px] flex-col gap-1.5 text-left">
            {answers.map((a, i) => {
              const q = questions[i];
              const ok = a.pickedIndex !== null && q.opts[a.pickedIndex]?.correct;
              const correctOpt = q.opts.find((o) => o.correct);
              const yourAnswer =
                a.pickedIndex !== null
                  ? q.opts[a.pickedIndex].text
                  : a.timeout
                    ? "Aucune réponse (temps écoulé)"
                    : "Aucune réponse";

              return (
                <div
                  key={i}
                  className={`mb-[9px] rounded-[10px] border border-l-4 border-border bg-[#FAF9F7] px-3.5 py-[11px] ${
                    ok ? "border-l-ink" : "border-l-[#EAAE18]"
                  }`}
                >
                  <p
                    className={`mb-1.5 flex items-start gap-2 text-[13.5px] font-bold ${
                      ok ? "text-primary" : "text-ink"
                    }`}
                  >
                    {ok ? (
                      <Check className="mt-0.5 h-[15px] w-[15px] shrink-0" aria-hidden="true" />
                    ) : (
                      <X className="mt-0.5 h-[15px] w-[15px] shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      Question {i + 1} — {q.q}
                    </span>
                  </p>
                  <div className="pl-[23px] text-[13px] leading-[1.6] text-ink">
                    <div>
                      <span className={qzLab}>Votre réponse :</span> {yourAnswer}
                    </div>
                    {!ok && correctOpt && (
                      <div>
                        <span className={qzLab}>Bonne réponse :</span> <b>{correctOpt.text}</b>
                      </div>
                    )}
                    {q.expl && (
                      <div className="mt-[5px] border-t border-dashed border-border pt-[5px]">
                        <span className={qzLab}>Explication :</span> {q.expl}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {pending && <p className="mt-3 text-xs text-muted">Enregistrement du score…</p>}
          {saveError && <p className="mt-3 text-xs text-danger">{saveError}</p>}

          <div className="mt-[18px] flex flex-wrap justify-center gap-2.5">
            <button type="button" className={btnLine} onClick={begin}>
              Refaire le quiz
            </button>
            <Link href="/mes-quiz" className={btnLine}>
              Retour aux quiz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pane}>
      <div className={`${innerBox} px-[26px] py-6`}>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-xs font-extrabold tracking-[0.04em] text-muted uppercase">
            Question {index + 1} sur {questions.length}
          </span>
          <span
            className={`inline-flex items-center gap-[5px] rounded-full px-3 py-[5px] text-[13px] font-bold text-primary ${
              timeLeft <= 5 ? "bg-[#F5E6EB]" : "bg-[#F5F0EC]"
            }`}
          >
            <Clock className="h-[15px] w-[15px]" aria-hidden="true" />
            <b className="font-black">{timeLeft}</b> s
          </span>
        </div>
        <div className="mb-[18px] h-[5px] overflow-hidden rounded-[3px] bg-[#F5F0EC]">
          <i
            className="block h-full bg-ink transition-[width] duration-300"
            style={{ width: `${Math.round((index / questions.length) * 100)}%` }}
          />
        </div>

        <h2 className="mb-4 text-[17px] leading-[1.35] font-extrabold text-ink">{question.q}</h2>

        <div className="mb-4 flex flex-col gap-[9px]">
          {question.opts.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(i)}
              className={`mb-[7px] flex w-full items-center gap-[11px] rounded-[11px] border-[1.5px] px-4 py-[13px] text-left text-sm text-ink transition hover:border-ink hover:bg-[#FAF9F7] ${
                picked === i ? "border-ink bg-[#FAF9F7]" : "border-border bg-white"
              }`}
            >
              <span
                className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                  picked === i ? "border-ink bg-ink shadow-[inset_0_0_0_3px_#fff]" : "border-border"
                }`}
              />
              <span>{opt.text}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={btnPrimary}
            disabled={picked === null}
            onClick={() => validate()}
          >
            {isLast ? "Terminer le quiz" : "Valider et continuer"}
          </button>
          <span className="text-[11.5px] text-muted italic">
            Vos résultats s&apos;afficheront à la fin.
          </span>
        </div>
      </div>
    </div>
  );
}
