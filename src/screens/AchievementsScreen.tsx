import { PageContainer } from "../components/PageContainer";
import { achievements } from "../game/config";
import type { StoredProgress } from "../game/types";
import styles from "./AchievementsScreen.module.css";

interface AchievementsScreenProps {
  progress: StoredProgress;
  onBack: () => void;
}

export function AchievementsScreen({ progress, onBack }: AchievementsScreenProps) {
  const owned = new Set(progress.achievements);

  return (
    <PageContainer>
      <button type="button" className={styles.backLink} onClick={onBack}>
        ← На главную
      </button>
      <h1 className={styles.title}>Достижения</h1>
      <p className={styles.subtitle}>
        Получено {owned.size} из {achievements.length}
      </p>

      <ul className={styles.list}>
        {achievements.map((achievement) => {
          const isUnlocked = owned.has(achievement.id);
          return (
            <li
              key={achievement.id}
              className={[styles.item, isUnlocked ? styles.itemUnlocked : styles.itemLocked].join(" ")}
            >
              <span className={styles.icon} aria-hidden="true">
                {isUnlocked ? "🏆" : "🔒"}
              </span>
              <div>
                <p className={styles.itemTitle}>{achievement.title}</p>
                <p className={styles.itemDescription}>{achievement.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
