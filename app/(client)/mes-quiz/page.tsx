import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseQuiz } from "@/lib/studio/parse-quiz";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";

interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  questions: string;
  master_themes: { name: string } | null;
  master_sheets: { title: string } | null;
}

const cardClass =
  "rounded-[18px] border border-border bg-surface shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]";

// LBP-CLIENT-06 : le CRUD admin existe déjà côté Studio (STU-QUIZ-01/02/03)
// — seul l'écran de passage manquait. `quizzes_read_published` (RLS
// réelle, baseline_schema_reel.sql) ne laisse passer que published=true
// pour un rôle client, donc pas besoin de filtrer côté requête.
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("compare bien mot pour mot et taille pour taille") : revérifié contre
// le vrai `renderQuizModule()` (LBP_V9.9_Studio.html ~L12016-12050) --
// la version précédente n'affichait qu'une liste nue (titre "Testez vos
// connaissances", inventé). Le vrai écran a un "cockpit" de 4 indicateurs
// (`.ov-gauges`/`.ov-card`, ~L132-138 : disponibles/réalisés/score
// moyen/à retravailler), un panneau de progression par quizz
// (`.ov-panel`/`.ov-q`/`.qrow`, ~L140-152), puis la liste
// (`.quiz-list-item`/`.qli-title`/`.qli-meta`/`.qli-src`, ~L394-396/908).
// Titre réel : "Vos quizz, {prénom} 🏆" (`PROFILES[profile].name`).
// Couleurs de cartes portées 1:1 (`--blue`/`--wine` valent toutes deux
// carbone `#445068` dans le fichier réel -- pas une coquille de notre
// part, les deux premières cartes partagent bien la même teinte border-
// top/valeur ; `--coral`=framboise, `--peach-tx`=framboise, `--peach`
// =cream-3 clair pour la 4e carte uniquement).
// Simplification assumée : le vrai badge distingue deux sources de quizz
// (fiches embarquées vs quizz autonomes, "brouillon"/"quizz G2S"/"fiche")
// -- notre schéma n'a qu'une seule table `quizzes`, badge unique
// "Quizz G2S".
export default async function ClientQuizListPage() {
  const session = await requireClient();
  const supabase = await createClient();

  const [{ data: quizzes }, { data: scores }] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, title, description, questions, master_themes(name), master_sheets(title)")
      .order("created_at", { ascending: false })
      .returns<QuizRow[]>(),
    supabase
      .from("quiz_scores")
      .select("quiz_id, score, taken_at")
      .eq("profile_id", session.userId)
      .not("quiz_id", "is", null)
      .order("taken_at", { ascending: false }),
  ]);

  const lastScoreByQuiz = new Map<string, number>();
  for (const s of scores ?? []) {
    if (!lastScoreByQuiz.has(s.quiz_id as string)) {
      lastScoreByQuiz.set(s.quiz_id as string, s.score as number);
    }
  }

  const rows = quizzes ?? [];
  const doneScores = rows
    .map((q) => lastScoreByQuiz.get(q.id))
    .filter((s): s is number => s !== undefined);
  const doneCount = doneScores.length;
  const avgScore = doneCount ? Math.round(doneScores.reduce((a, b) => a + b, 0) / doneCount) : 0;
  const weakCount = doneScores.filter((s) => s < 70).length;
  const firstName = session.profile.full_name.split(" ")[0];

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Évaluation</Eyebrow>
      <SectionTitle>Vos quizz, {firstName} 🏆</SectionTitle>

      {rows.length === 0 ? (
        <div className={`${cardClass} p-[18px]`}>
          <p className="text-sm text-muted">Aucun quizz disponible pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="mb-[18px] grid grid-cols-4 gap-[14px]">
            <div className={`${cardClass} border-t-[3px] border-t-ink px-[18px] py-4`}>
              <p className="text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase">
                Quizz disponibles
              </p>
              <p className="mt-[5px] text-[28px] font-extrabold text-ink">{rows.length}</p>
              <p className="mt-[5px] text-[11px] text-muted">tous thèmes confondus</p>
            </div>
            <div className={`${cardClass} border-t-[3px] border-t-ink px-[18px] py-4`}>
              <p className="text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase">
                Quizz réalisés
              </p>
              <p className="mt-[5px] text-[28px] font-extrabold text-ink">{doneCount}</p>
              <p className="mt-[5px] text-[11px] text-muted">sur {rows.length}</p>
            </div>
            <div className={`${cardClass} border-t-[3px] border-t-primary px-[18px] py-4`}>
              <p className="text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase">
                Score moyen
              </p>
              <p className="mt-[5px] text-[28px] font-extrabold text-primary">
                {doneCount ? `${avgScore} %` : "—"}
              </p>
              <p className="mt-[5px] text-[11px] text-muted">
                {doneCount ? "sur les quizz réalisés" : "aucun quizz réalisé"}
              </p>
            </div>
            <div className={`${cardClass} border-t-[3px] border-t-[#EFE7E1] px-[18px] py-4`}>
              <p className="text-[10.5px] font-bold tracking-[0.07em] text-muted uppercase">
                À retravailler
              </p>
              <p className="mt-[5px] text-[28px] font-extrabold text-primary">{weakCount}</p>
              <p className="mt-[5px] text-[11px] text-muted">score &lt; 70 %</p>
            </div>
          </div>

          <div className={`${cardClass} mb-4 p-[18px]`}>
            <h2 className="mb-[13px] flex items-center gap-2 text-[13px] font-extrabold tracking-[0.03em] text-ink uppercase">
              📊 Votre progression, {firstName}
            </h2>
            <div className="flex flex-col gap-3">
              {rows.map((quiz) => {
                const score = lastScoreByQuiz.get(quiz.id);
                return (
                  <div key={quiz.id}>
                    <div className="mb-[5px] flex justify-between text-[12.5px] font-bold text-ink">
                      <span>{quiz.title}</span>
                      <span>{score !== undefined ? `${score} %` : "non réalisé"}</span>
                    </div>
                    <div className="h-[9px] overflow-hidden rounded-[5px] bg-[#F5F0EC]">
                      <div className="h-full bg-ink" style={{ width: `${score ?? 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-1 mb-3 text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
            {rows.length} quizz — cliquez pour les faire
          </p>

          <div className="flex flex-col gap-2.5">
            {rows.map((quiz) => {
              const attachedTo =
                quiz.master_themes?.name ?? quiz.master_sheets?.title ?? "Quizz G2S";
              const nbQuestions = parseQuiz(quiz.questions).length;
              const lastScore = lastScoreByQuiz.get(quiz.id);
              return (
                <div
                  key={quiz.id}
                  className={`${cardClass} flex items-center justify-between gap-3 px-[18px] py-[15px]`}
                >
                  <div>
                    <p className="text-[15px] font-extrabold text-ink">
                      🏆 {quiz.title}{" "}
                      <span className="ml-1.5 rounded-md bg-[#EFE7E1] px-[7px] py-0.5 text-[9.5px] font-extrabold text-primary uppercase">
                        Quizz G2S
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {attachedTo} · {nbQuestions} question{nbQuestions > 1 ? "s" : ""}
                      {lastScore !== undefined ? ` · dernier score ${lastScore} %` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/mes-quiz/${quiz.id}`}
                    className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                  >
                    {lastScore !== undefined ? "Refaire" : "Commencer"}
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
