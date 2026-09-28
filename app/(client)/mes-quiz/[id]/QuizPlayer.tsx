"use client";

import { useState, useTransition } from "react";
import type { QuizQuestion } from "@/lib/studio/parse-quiz";
import { submitQuizScore } from "../actions";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { Button } from "@/ui-kit/Button";

// LBP-CLIENT-06 : une question à la fois, réponse validée avant de passer
// à la suivante (l'explication de STU-QUIZ-02, `expl`, n'était jusqu'ici
// jamais consommée nulle part — c'est le premier écran qui l'affiche
// réellement). Score envoyé une seule fois à la fin, via quiz_scores
// (table réelle de James, jamais touchée avant ce ticket).
export default function QuizPlayer({
  quizId,
  questions,
}: {
  quizId: string;
  questions: QuizQuestion[];
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [validated, setValidated] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;

  function validate() {
    if (selected === null) return;
    setValidated(true);
    if (question.opts[selected].correct) {
      setCorrectCount((c) => c + 1);
    }
  }

  function next() {
    if (isLast) {
      const finalScore = (correctCount / questions.length) * 100;
      startTransition(async () => {
        setSaveError(await submitQuizScore(quizId, finalScore));
      });
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setValidated(false);
  }

  if (finished) {
    const finalScore = (correctCount / questions.length) * 100;
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink">Résultat</h2>
        <p className="mt-2 text-sm text-ink">
          {correctCount} / {questions.length} bonnes réponses
        </p>
        <div className="mt-2">
          <Badge tone={finalScore >= 50 ? "green" : "amber"}>{finalScore.toFixed(0)} %</Badge>
        </div>
        {pending && <p className="mt-2 text-xs text-muted">Enregistrement du score…</p>}
        {saveError && <p className="mt-2 text-xs text-danger">{saveError}</p>}
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs text-muted">
        Question {index + 1} / {questions.length}
      </p>
      <h2 className="mt-1 text-base font-semibold text-ink">{question.q}</h2>

      <div className="mt-4 flex flex-col gap-2">
        {question.opts.map((opt, i) => {
          const isSelected = selected === i;
          const showCorrectness = validated;
          const tone = !showCorrectness
            ? isSelected
              ? "border-primary bg-primary-soft"
              : "border-border"
            : opt.correct
              ? "border-success bg-success-bg"
              : isSelected
                ? "border-danger bg-danger-bg"
                : "border-border";

          return (
            <button
              key={i}
              type="button"
              disabled={validated}
              onClick={() => setSelected(i)}
              className={`rounded-md border px-3 py-2 text-left text-sm text-ink transition-colors disabled:cursor-default ${tone}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {validated && question.expl && (
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-ink">Explication : </span>
          {question.expl}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        {!validated ? (
          <Button type="button" variant="primary" disabled={selected === null} onClick={validate}>
            Valider
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={next}>
            {isLast ? "Voir le résultat" : "Question suivante"}
          </Button>
        )}
      </div>
    </Card>
  );
}
