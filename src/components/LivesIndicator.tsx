import { MAX_LIVES_MISTAKES } from "../game/types";
import styles from "./LivesIndicator.module.css";

interface LivesIndicatorProps {
  mistakesUsed: number;
}

export function LivesIndicator({ mistakesUsed }: LivesIndicatorProps) {
  const remaining = Math.max(0, MAX_LIVES_MISTAKES - mistakesUsed);
  return (
    <div
      className={styles.wrapper}
      role="img"
      aria-label={`Осталось допустимых ошибок: ${remaining} из ${MAX_LIVES_MISTAKES}`}
    >
      {Array.from({ length: MAX_LIVES_MISTAKES }).map((_, i) => (
        <span key={i} className={i < remaining ? styles.shieldActive : styles.shieldUsed} aria-hidden="true">
          🛡
        </span>
      ))}
    </div>
  );
}
