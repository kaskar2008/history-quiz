import { Button } from "../components/Button";
import { PageContainer } from "../components/PageContainer";
import { StarRating } from "../components/StarRating";
import { TOTAL_LEVELS, type GameMode, type StoredProgress } from "../game/types";
import questionsIndexData from "../data/questions/index.json";
import type { QuestionsIndex } from "../data/types";
import styles from "./LevelMapScreen.module.css";

const questionsIndex = questionsIndexData as QuestionsIndex;

interface LevelMapScreenProps {
  mode: GameMode;
  currentLevel: number;
  progress: StoredProgress;
  error: string | null;
  onStart: () => void;
  onBack: () => void;
}

export function LevelMapScreen({ mode, currentLevel, progress, error, onStart, onBack }: LevelMapScreenProps) {
  const bestResults = progress.bestLevelResults[mode];

  return (
    <div className={styles.screen}>
      <PageContainer>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← На главную
        </button>
        <h1 className={styles.title}>Карта уровней</h1>
        <p className={styles.subtitle}>
          Режим: {mode === "lives" ? "«Жизни»" : "«Бог»"}. Уровни проходятся по порядку, от простого к
          сложному.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <ol className={styles.list}>
          {questionsIndex.levels.map((entry) => {
            const best = bestResults[String(entry.level)];
            const isCurrent = entry.level === currentLevel;
            const isPast = entry.level < currentLevel;
            const isLocked = entry.level > currentLevel;

            return (
              <li
                key={entry.level}
                className={[styles.item, isCurrent ? styles.itemCurrent : "", isLocked ? styles.itemLocked : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={styles.itemMain}>
                  <span className={styles.itemLevel}>{entry.level}</span>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{entry.title}</span>
                    <span className={styles.itemStatus}>
                      {isPast ? "Пройден" : isCurrent ? "Следующий" : "Заблокирован"}
                    </span>
                  </div>
                </div>
                <div className={styles.itemMeta}>
                  {best ? (
                    <>
                      <StarRating stars={best.stars} size="small" />
                      <span className={styles.itemScore}>{best.score} очк.</span>
                    </>
                  ) : (
                    <span className={styles.itemNoResult}>—</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <p className={styles.hint}>
          Всего уровней: {TOTAL_LEVELS}. На каждом — 30 случайно выбранных вопросов без повторов.
        </p>
      </PageContainer>

      <div className={styles.bottomBar}>
        <Button variant="primary" fullWidth onClick={onStart}>
          {currentLevel === 1 ? "Начать уровень 1" : `Продолжить: уровень ${currentLevel}`}
        </Button>
      </div>
    </div>
  );
}
