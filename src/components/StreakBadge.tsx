import styles from "./StreakBadge.module.css";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak < 2) return null;
  return (
    <span className={styles.badge} aria-label={`Серия правильных ответов: ${streak}`}>
      🔥 {streak}
    </span>
  );
}
