import { Button } from "../components/Button";
import { PageContainer } from "../components/PageContainer";
import { StarRating } from "../components/StarRating";
import type { LevelOutcome } from "../game/types";
import styles from "./LevelResultScreen.module.css";

interface LevelResultScreenProps {
  outcome: LevelOutcome;
  isLastLevel: boolean;
  onNext: () => void;
  onRequestExit: () => void;
}

export function LevelResultScreen({ outcome, isLastLevel, onNext, onRequestExit }: LevelResultScreenProps) {
  return (
    <PageContainer>
      <button type="button" className={styles.backLink} onClick={onRequestExit}>
        ← Выйти из игры
      </button>
      <div className={styles.wrapper}>
        <p className={styles.eyebrow}>Уровень {outcome.level} пройден</p>
        <div className={styles.starsRow}>
          <StarRating stars={outcome.stars} size="large" />
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {outcome.correct} / {outcome.total}
            </span>
            <span className={styles.statLabel}>Правильных ответов</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{outcome.wrong}</span>
            <span className={styles.statLabel}>Ошибок</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>+{outcome.score}</span>
            <span className={styles.statLabel}>Очков за уровень</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{outcome.maxStreak}</span>
            <span className={styles.statLabel}>Макс. серия</span>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={onNext}>
          {isLastLevel ? "Посмотреть итог" : "Следующий уровень"}
        </Button>
      </div>
    </PageContainer>
  );
}
