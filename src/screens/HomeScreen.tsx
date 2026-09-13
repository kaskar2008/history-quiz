import { Button } from "../components/Button";
import { PageContainer } from "../components/PageContainer";
import type { StoredProgress } from "../game/types";
import styles from "./HomeScreen.module.css";

interface HomeScreenProps {
  progress: StoredProgress;
  onStart: () => void;
  onOpenStatistics: () => void;
  onOpenAchievements: () => void;
}

export function HomeScreen({ progress, onStart, onOpenStatistics, onOpenAchievements }: HomeScreenProps) {
  const livesBest = progress.statistics.lives.bestScore;
  const godBest = progress.statistics.god.bestScore;

  return (
    <PageContainer>
      <header className={styles.hero}>
        <p className={styles.badge}>Квиз по мировой истории</p>
        <h1 className={styles.title}>Путешествие сквозь века</h1>
        <p className={styles.subtitle}>
          10 уровней, сотни вопросов о людях и событиях всех эпох и континентов. Проверьте, насколько
          хорошо вы знаете историю человечества.
        </p>
      </header>

      <Button variant="primary" fullWidth onClick={onStart}>
        Начать игру
      </Button>

      <section className={styles.records} aria-label="Рекорды по режимам">
        <div className={styles.recordCard}>
          <span className={styles.recordLabel}>Режим «Жизни»</span>
          <span className={styles.recordValue}>{livesBest} очков</span>
        </div>
        <div className={styles.recordCard}>
          <span className={styles.recordLabel}>Режим «Бог»</span>
          <span className={styles.recordValue}>{godBest} очков</span>
        </div>
      </section>

      <div className={styles.links}>
        <Button variant="secondary" fullWidth onClick={onOpenStatistics}>
          Статистика
        </Button>
        <Button variant="secondary" fullWidth onClick={onOpenAchievements}>
          Достижения ({progress.achievements.length})
        </Button>
      </div>
    </PageContainer>
  );
}
