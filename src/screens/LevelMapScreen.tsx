import { useState } from "react";
import { Button } from "../components/Button";
import { PageContainer } from "../components/PageContainer";
import { StarRating } from "../components/StarRating";
import type { GameMode, StoredProgress } from "../game/types";
import questionsIndexData from "../data/questions/index.json";
import type { QuestionsIndex } from "../data/types";
import styles from "./LevelMapScreen.module.css";

const questionsIndex = questionsIndexData as QuestionsIndex;

const modeLabels: Record<GameMode, string> = {
  lives: "«Жизни»",
  god: "«Бог»",
  custom: "«Кастом»",
};

interface LevelMapScreenProps {
  mode: GameMode;
  totalLevels: number;
  questionsPerLevel: number;
  currentLevel: number;
  progress: StoredProgress;
  error: string | null;
  onStart: () => void;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

export function LevelMapScreen({
  mode,
  totalLevels,
  questionsPerLevel,
  currentLevel,
  progress,
  error,
  onStart,
  onSelectLevel,
  onBack,
}: LevelMapScreenProps) {
  const bestResults = progress.bestLevelResults[mode];
  const levels =
    mode === "custom"
      ? Array.from({ length: totalLevels }, (_, i) => ({ level: i + 1, title: `Уровень ${i + 1}` }))
      : questionsIndex.levels;
  // "Бог" has no fail condition, so any level can be picked and played
  // directly in any order — unlike "Жизни", it isn't gated by progression.
  const isFreelyPlayable = mode === "god";
  // Picking a level here is two-step: a click only highlights it, the bottom
  // button actually starts it — so a misclick doesn't jump straight into a quiz.
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);

  return (
    <div className={styles.screen}>
      <PageContainer>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← На главную
        </button>
        <h1 className={styles.title}>Карта уровней</h1>
        <p className={styles.subtitle}>
          Режим: {modeLabels[mode]}.{" "}
          {isFreelyPlayable
            ? "Можно выбрать и пройти любой уровень в любом порядке."
            : "Уровни проходятся по порядку, от простого к сложному."}
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <ol className={styles.list}>
          {levels.map((entry) => {
            const best = bestResults[String(entry.level)];
            const isSelected = isFreelyPlayable ? entry.level === selectedLevel : entry.level === currentLevel;
            const isPast = isFreelyPlayable ? Boolean(best) : entry.level < currentLevel;
            const isLocked = isFreelyPlayable ? false : entry.level > currentLevel;
            const statusLabel = isFreelyPlayable
              ? isSelected
                ? "Выбран"
                : isPast
                  ? "Пройден"
                  : "Доступен"
              : isPast
                ? "Пройден"
                : isSelected
                  ? "Следующий"
                  : "Заблокирован";

            const itemContent = (
              <>
                <div className={styles.itemMain}>
                  <span className={styles.itemLevel}>{entry.level}</span>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{entry.title}</span>
                    <span className={styles.itemStatus}>{statusLabel}</span>
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
              </>
            );

            const itemClassName = [styles.item, isSelected ? styles.itemCurrent : "", isLocked ? styles.itemLocked : ""]
              .filter(Boolean)
              .join(" ");

            return (
              <li key={entry.level}>
                {isFreelyPlayable ? (
                  <button
                    type="button"
                    className={[itemClassName, styles.itemButton].join(" ")}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedLevel(entry.level)}
                  >
                    {itemContent}
                  </button>
                ) : (
                  <div className={itemClassName}>{itemContent}</div>
                )}
              </li>
            );
          })}
        </ol>

        <p className={styles.hint}>
          Всего уровней: {totalLevels}. На каждом — {questionsPerLevel} случайно выбранных вопросов без повторов.
        </p>
      </PageContainer>

      <div className={styles.bottomBar}>
        {isFreelyPlayable ? (
          <Button variant="primary" fullWidth onClick={() => onSelectLevel(selectedLevel)}>
            {`Начать уровень ${selectedLevel}`}
          </Button>
        ) : (
          <Button variant="primary" fullWidth onClick={onStart}>
            {currentLevel === 1 ? "Начать уровень 1" : `Продолжить: уровень ${currentLevel}`}
          </Button>
        )}
      </div>
    </div>
  );
}
