"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Clock, Check, X } from "lucide-react";
import type { QuizQuestion } from "@/lib/studio/parse-quiz";
import { submitQuizScore } from "../actions";
import { Card } from "@/ui-kit/Card";
import { Button } from "@/ui-kit/Button";

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
      <Card>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink">
          {questions.length} question{questions.length > 1 ? "s" : ""} · {QUIZ_TIME_PER_QUESTION}{" "}
          secondes par question.
        </p>
        <p className="mt-2 text-sm text-muted">
          Les questions s&apos;affichent une par une. Vous ne verrez vos résultats et les
          explications qu&apos;à la fin du quiz. Une question sans réponse dans le temps imparti est
          comptée comme incorrecte.
        </p>
        <div className="mt-4">
          <Button type="button" variant="primary" onClick={begin}>
            Commencer le quiz
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "finished") {
    const correct = answers.filter(
      (a, i) => a.pickedIndex !== null && questions[i].opts[a.pickedIndex]?.correct,
    ).length;
    const pct = Math.round((correct / questions.length) * 100);

    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink">Résultat</h2>
        <p className="mt-1 text-2xl font-semibold text-ink">
          {correct} / {questions.length}
        </p>
        <p className="text-sm text-muted">{pct} % de bonnes réponses</p>
        <p className="mt-2 text-sm text-ink">
          {pct < 70
            ? "Votre score indique que ce sujet mérite d'être approfondi."
            : "Beau score : vous maîtrisez bien ce sujet."}
        </p>

        <div className="mt-5 flex flex-col gap-3">
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
                className={`rounded-md border p-3 text-sm ${ok ? "border-success bg-success-bg" : "border-danger bg-danger-bg"}`}
              >
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  {ok ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <X className="h-4 w-4 text-danger" />
                  )}
                  Question {i + 1} — {q.q}
                </p>
                <p className="mt-1 text-ink">
                  <span className="text-muted">Votre réponse : </span>
                  {yourAnswer}
                </p>
                {!ok && correctOpt && (
                  <p className="text-ink">
                    <span className="text-muted">Bonne réponse : </span>
                    <span className="font-medium">{correctOpt.text}</span>
                  </p>
                )}
                {q.expl && (
                  <p className="mt-1 text-ink">
                    <span className="text-muted">Explication : </span>
                    {q.expl}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {pending && <p className="mt-3 text-xs text-muted">Enregistrement du score…</p>}
        {saveError && <p className="mt-3 text-xs text-danger">{saveError}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={begin}>
            Refaire le quiz
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Question {index + 1} sur {questions.length}
        </p>
        <p
          className={`flex items-center gap-1 text-xs font-medium ${timeLeft <= 5 ? "text-danger" : "text-muted"}`}
        >
          <Clock className="h-3.5 w-3.5" />
          {timeLeft} s
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-border">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${(index / questions.length) * 100}%` }}
        />
      </div>

      <h2 className="mt-4 text-base font-semibold text-ink">{question.q}</h2>

      <div className="mt-4 flex flex-col gap-2">
        {question.opts.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPicked(i)}
            className={`rounded-md border px-3 py-2 text-left text-sm text-ink transition-colors ${
              picked === i ? "border-primary bg-primary-soft" : "border-border"
            }`}
          >
            {opt.text}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted">Vos résultats s&apos;afficheront à la fin.</p>
        <Button
          type="button"
          variant="primary"
          disabled={picked === null}
          onClick={() => validate()}
        >
          {isLast ? "Terminer le quiz" : "Valider et continuer"}
        </Button>
      </div>
    </Card>
  );
}
