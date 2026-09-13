import { useState } from "react";
import { PageContainer } from "../components/PageContainer";
import type { GameMode, ModeStatistics, StoredProgress } from "../game/types";
import styles from "./StatisticsScreen.module.css";

interface StatisticsScreenProps {
  progress: StoredProgress;
  onBack: () => void;
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.statRow}>
      <span className={styles.statRowLabel}>{label}</span>
      <span className={styles.statRowValue}>{value}</span>
    </div>
  );
}

function ModeStatsPanel({ stats, mode, progress }: { stats: ModeStatistics; mode: GameMode; progress: StoredProgress }) {
  const accuracy =
    stats.totalCorrectAnswers + stats.totalWrongAnswers > 0
      ? Math.round((stats.totalCorrectAnswers / (stats.totalCorrectAnswers + stats.totalWrongAnswers)) * 100)
      : 0;

  const recentAttempts = progress.attempts
    .filter((a) => a.mode === mode)
    .slice(-5)
    .reverse();

  return (
    <div className={styles.panel}>
      <StatRow label="Лучший результат" value={`${stats.bestScore} очков`} />
      <StatRow label="Лучший достигнутый уровень" value={stats.bestLevel} />
      <StatRow label="Всего попыток" value={stats.totalAttempts} />
      <StatRow label="Полных прохождений" value={stats.completedRuns} />
      <StatRow label="Верных ответов" value={stats.totalCorrectAnswers} />
      <StatRow label="Ошибок" value={stats.totalWrongAnswers} />
      <StatRow label="Точность" value={`${accuracy}%`} />

      {recentAttempts.length > 0 && (
        <div className={styles.recentBlock}>
          <p className={styles.recentHeading}>Последние попытки</p>
          <ul className={styles.recentList}>
            {recentAttempts.map((attempt) => (
              <li key={attempt.id} className={styles.recentItem}>
                <span>{new Date(attempt.completedAt).toLocaleDateString("ru-RU")}</span>
                <span>{attempt.score} очк.</span>
                <span>ур. {attempt.highestLevelReached}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function StatisticsScreen({ progress, onBack }: StatisticsScreenProps) {
  const [activeTab, setActiveTab] = useState<GameMode>("lives");

  return (
    <PageContainer>
      <button type="button" className={styles.backLink} onClick={onBack}>
        ← На главную
      </button>
      <h1 className={styles.title}>Статистика</h1>

      <div className={styles.tabs} role="tablist" aria-label="Режим игры">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "lives"}
          className={[styles.tab, activeTab === "lives" ? styles.tabActive : ""].join(" ")}
          onClick={() => setActiveTab("lives")}
        >
          Жизни
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "god"}
          className={[styles.tab, activeTab === "god" ? styles.tabActive : ""].join(" ")}
          onClick={() => setActiveTab("god")}
        >
          Бог
        </button>
      </div>

      <ModeStatsPanel stats={progress.statistics[activeTab]} mode={activeTab} progress={progress} />
    </PageContainer>
  );
}
