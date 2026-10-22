import { useMemo, useState } from 'preact/hooks';
import type { QuizQuestion } from '@/data/quiz';
import './quiz.css';

export interface QuizCharacter {
  slug: string;
  name: string;
  portrait: string;
  portraitTransform: string;
  bg: string;
  href: string;
}

interface Props {
  questions: QuizQuestion[];
  characters: QuizCharacter[];
}

const LETTERS = 'ABCDEF';

/** Points par copain ; égalité départagée par les dernières questions (les plus précises). */
function rank(questions: QuizQuestion[], picks: number[], slugs: string[]) {
  return slugs
    .map((slug) => {
      let points = 0;
      let last = -1;
      picks.forEach((a, q) => {
        if (questions[q].answers[a]?.who.includes(slug)) {
          points++;
          last = q;
        }
      });
      return { slug, points, last };
    })
    .sort((a, b) => b.points - a.points || b.last - a.last);
}

export default function Quiz({ questions, characters }: Props) {
  const [step, setStep] = useState(-1); // -1 : accueil ; questions.length : résultat
  const [picks, setPicks] = useState<number[]>([]);
  const bySlug = useMemo(() => new Map(characters.map((c) => [c.slug, c])), [characters]);

  const choose = (a: number) => {
    const next = [...picks.slice(0, step), a];
    setPicks(next);
    setStep(step + 1);
  };
  const restart = () => {
    setPicks([]);
    setStep(0);
  };

  if (step < 0) {
    return (
      <div class="qz qz--intro">
        <p class="qz__kicker hand">{questions.length} questions · 2 minutes · aucune bonne réponse</p>
        <ul class="qz__faces" aria-hidden="true">
          {characters.slice(0, 7).map((c) => (
            <li style={`--c: ${c.bg}`}>
              <img src={c.portrait} alt="" style={`transform: ${c.portraitTransform}`} loading="lazy" />
            </li>
          ))}
        </ul>
        <button type="button" class="qz__btn" onClick={() => setStep(0)}>
          Commencer le quiz
        </button>
      </div>
    );
  }

  if (step >= questions.length) {
    const ranking = rank(questions, picks, characters.map((c) => c.slug));
    const winner = bySlug.get(ranking[0].slug)!;
    const runnersUp = ranking.slice(1, 3).map((r) => bySlug.get(r.slug)!);
    const score = Math.round((ranking[0].points / questions.length) * 100);
    return (
      <div class="qz qz--result">
        <p class="qz__kicker hand">Tu ressembles à…</p>
        <div class="qz__winner" style={`--c: ${winner.bg}`}>
          <div class="qz__winner-art">
            <img src={winner.portrait} alt="" style={`transform: ${winner.portraitTransform}`} />
          </div>
          <div class="qz__winner-body">
            <h2 class="qz__winner-name">{winner.name}</h2>
            <p class="qz__match">
              <strong>{score} %</strong> de points communs
            </p>
            <a class="qz__btn" href={winner.href}>
              Voir sa fiche
            </a>
          </div>
        </div>
        <p class="qz__also">
          Avec un petit côté <strong>{runnersUp[0].name}</strong> et <strong>{runnersUp[1].name}</strong>.
        </p>
        <button type="button" class="qz__btn qz__btn--ghost" onClick={restart}>
          Refaire le quiz
        </button>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div class="qz">
      <div class="qz__progress" aria-label={`Question ${step + 1} sur ${questions.length}`}>
        <span style={`width: ${(step / questions.length) * 100}%`} />
      </div>
      <p class="qz__count">
        Question {step + 1} / {questions.length}
      </p>
      <h2 class="qz__question">{q.question}</h2>
      <ul class="qz__answers">
        {q.answers.map((a, i) => (
          <li key={`${step}-${i}`}>
            <button type="button" class="qz__answer" aria-pressed={picks[step] === i} onClick={() => choose(i)}>
              <span class="qz__letter">{LETTERS[i]}</span>
              <span>{a.text}</span>
            </button>
          </li>
        ))}
      </ul>
      {step > 0 && (
        <button type="button" class="qz__back" onClick={() => setStep(step - 1)}>
          ← Question précédente
        </button>
      )}
    </div>
  );
}
