import { useMemo } from "react";
import { Button } from "../components/Button";
import { GameTopBar } from "../components/GameTopBar";
import { InfoButton } from "../components/InfoButton";
import { OptionButton, type OptionState } from "../components/OptionButton";
import { QuestionTimer } from "../components/QuestionTimer";
import { shuffle } from "../services/questionLoader";
import type { Question } from "../data/types";
import type { GameMode, GameStage } from "../game/types";
import styles from "./QuestionScreen.module.css";

interface QuestionScreenProps {
  question: Question;
  stage: Extract<GameStage, "question" | "answer-result">;
  selectedOptionId: string | null;
  timedOut: boolean;
  questionDeadlineAt: number | null;
  timeLimitSeconds: number | null;
  shuffleOptions: boolean;
  mode: GameMode;
  level: number;
  questionIndex: number;
  totalQuestions: number;
  score: number;
  currentStreak: number;
  totalMistakes: number;
  onSelectAnswer: (optionId: string) => void;
  onTimeExpired: () => void;
  onNext: () => void;
  onRequestExit: () => void;
}

const LETTERS = ["А", "Б", "В", "Г"];

export function QuestionScreen({
  question,
  stage,
  selectedOptionId,
  timedOut,
  questionDeadlineAt,
  timeLimitSeconds,
  shuffleOptions,
  mode,
  level,
  questionIndex,
  totalQuestions,
  score,
  currentStreak,
  totalMistakes,
  onSelectAnswer,
  onTimeExpired,
  onNext,
  onRequestExit,
}: QuestionScreenProps) {
  const isAnswered = stage === "answer-result";
  const isCorrect = isAnswered && !timedOut && selectedOptionId === question.correctOptionId;

  // Shuffle the visual order of options per question (unless disabled) so the
  // correct answer's position can't be memorized across replays. Stable for
  // the lifetime of this question (only reshuffles when the question itself
  // changes), so it doesn't jump around on unrelated re-renders (e.g. the
  // timer ticking).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledOptions = useMemo(
    () => (shuffleOptions ? shuffle(question.options) : question.options),
    [question.id, shuffleOptions],
  );

  function getOptionState(optionId: string): OptionState {
    if (!isAnswered) return "idle";
    if (optionId === question.correctOptionId) return "correct";
    if (optionId === selectedOptionId) return "incorrect";
    return "disabled";
  }

  return (
    <div className={styles.screen}>
      <GameTopBar
        level={level}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        score={score}
        currentStreak={currentStreak}
        mode={mode}
        totalMistakes={totalMistakes}
        onRequestExit={onRequestExit}
      />

      <div className={styles.content}>
        {!isAnswered && questionDeadlineAt !== null && timeLimitSeconds !== null && (
          <QuestionTimer
            key={question.id}
            deadlineAt={questionDeadlineAt}
            totalDurationSeconds={timeLimitSeconds}
            onExpire={onTimeExpired}
          />
        )}

        <div className={styles.questionHeader}>
          <h1 className={styles.questionText}>{question.question}</h1>
          {question.details && <InfoButton details={question.details} />}
        </div>

        <div className={styles.options} role="group" aria-label="Варианты ответа">
          {shuffledOptions.map((option, index) => (
            <OptionButton
              key={option.id}
              label={option.text}
              optionLetter={LETTERS[index] ?? String(index + 1)}
              state={getOptionState(option.id)}
              onClick={() => onSelectAnswer(option.id)}
            />
          ))}
        </div>

        {isAnswered && (
          <div
            className={[styles.explanation, isCorrect ? styles.explanationCorrect : styles.explanationWrong].join(
              " ",
            )}
            role="status"
          >
            <p className={styles.explanationHeading}>
              {isCorrect ? "Верно!" : timedOut ? "Время вышло" : "Неверно"}
            </p>
            <p className={styles.explanationText}>{question.explanation}</p>
          </div>
        )}
      </div>

      {isAnswered && (
        <div className={styles.bottomBar}>
          <Button variant="primary" fullWidth onClick={onNext}>
            Далее
          </Button>
        </div>
      )}
    </div>
  );
}
