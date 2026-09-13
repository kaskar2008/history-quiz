import { Button } from "../components/Button";
import { PageContainer } from "../components/PageContainer";
import { getAchievementDefinition } from "../services/achievementService";
import { getRankForScore } from "../services/scoringService";
import type { FinishReason, GameMode } from "../game/types";
import styles from "./GameResultScreen.module.css";

interface GameResultScreenProps {
  mode: GameMode;
  finishReason: FinishReason;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredQuestions: number;
  maxStreak: number;
  highestLevelReached: number;
  newAchievements: string[];
  isNewRecord: boolean;
  previousRecordScore: number | null;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameResultScreen({
  mode,
  finishReason,
  score,
  correctAnswers,
  wrongAnswers,
  answeredQuestions,
  maxStreak,
  highestLevelReached,
  newAchievements,
  isNewRecord,
  previousRecordScore,
  onPlayAgain,
  onGoHome,
}: GameResultScreenProps) {
  const accuracy = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
  const rank = getRankForScore(score);

  const heading =
    finishReason === "completed"
      ? "Поздравляем, история пройдена!"
      : finishReason === "too-many-mistakes"
        ? "Игра окончена: превышен лимит ошибок"
        : "Игра завершена";

  return (
    <PageContainer>
      <div className={styles.wrapper}>
        <p className={styles.eyebrow}>Режим «{mode === "lives" ? "Жизни" : "Бог"}»</p>
        <h1 className={styles.heading}>{heading}</h1>

        {isNewRecord && (
          <div className={styles.recordBanner}>
            <p className={styles.recordTitle}>🎉 Новый рекорд!</p>
            {previousRecordScore !== null && (
              <p className={styles.recordText}>
                Предыдущий результат: {previousRecordScore} очков. Новый: {score} очков.
              </p>
            )}
          </div>
        )}

        <div className={styles.scoreCard}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreLabel}>очков • звание «{rank.title}»</span>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{highestLevelReached}</span>
            <span className={styles.statLabel}>Достигнутый уровень</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{accuracy}%</span>
            <span className={styles.statLabel}>Точность</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{correctAnswers}</span>
            <span className={styles.statLabel}>Верных ответов</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{wrongAnswers}</span>
            <span className={styles.statLabel}>Ошибок</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{maxStreak}</span>
            <span className={styles.statLabel}>Макс. серия</span>
          </div>
        </div>

        {newAchievements.length > 0 && (
          <div className={styles.achievements}>
            <p className={styles.achievementsHeading}>Новые достижения</p>
            <ul className={styles.achievementsList}>
              {newAchievements.map((id) => {
                const def = getAchievementDefinition(id);
                if (!def) return null;
                return (
                  <li key={id} className={styles.achievementItem}>
                    🏆 <strong>{def.title}</strong> — {def.description}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="primary" fullWidth onClick={onPlayAgain}>
            Сыграть ещё
          </Button>
          <Button variant="secondary" fullWidth onClick={onGoHome}>
            На главную
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
