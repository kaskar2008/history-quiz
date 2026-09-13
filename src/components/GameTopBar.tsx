import type { GameMode } from "../game/types";
import { LivesIndicator } from "./LivesIndicator";
import { ProgressBar } from "./ProgressBar";
import { StreakBadge } from "./StreakBadge";
import styles from "./GameTopBar.module.css";

interface GameTopBarProps {
  level: number;
  questionIndex: number;
  totalQuestions: number;
  score: number;
  currentStreak: number;
  mode: GameMode;
  totalMistakes: number;
  onRequestExit: () => void;
}

export function GameTopBar({
  level,
  questionIndex,
  totalQuestions,
  score,
  currentStreak,
  mode,
  totalMistakes,
  onRequestExit,
}: GameTopBarProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <button type="button" className={styles.exitButton} onClick={onRequestExit} aria-label="Выйти из игры">
          ✕
        </button>
        <span className={styles.level}>Уровень {level}</span>
        <span className={styles.score}>{score} очк.</span>
      </div>
      <ProgressBar
        current={questionIndex + 1}
        total={totalQuestions}
        label={`Вопрос ${questionIndex + 1} из ${totalQuestions}`}
      />
      <div className={styles.row}>
        <span className={styles.progressText}>
          {questionIndex + 1} / {totalQuestions}
        </span>
        <div className={styles.rightGroup}>
          <StreakBadge streak={currentStreak} />
          {mode === "lives" ? (
            <LivesIndicator mistakesUsed={totalMistakes} />
          ) : (
            <span className={styles.godMistakes} aria-label={`Ошибок: ${totalMistakes}`}>
              Ошибок: {totalMistakes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
