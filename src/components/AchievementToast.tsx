import { useEffect, useRef, useState } from "react";
import { getAchievementDefinition } from "../services/achievementService";
import styles from "./AchievementToast.module.css";

interface ToastItem {
  key: string;
  title: string;
  description: string;
}

interface AchievementToastHostProps {
  /** Full accumulated list of achievement ids unlocked so far in the current run. */
  unlockedIds: string[];
}

let toastCounter = 0;

export function AchievementToastHost({ unlockedIds }: AchievementToastHostProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenCount = useRef(0);

  useEffect(() => {
    if (unlockedIds.length <= seenCount.current) {
      seenCount.current = unlockedIds.length;
      return;
    }
    const newIds = unlockedIds.slice(seenCount.current);
    seenCount.current = unlockedIds.length;

    const newToasts: ToastItem[] = newIds
      .map((id) => {
        const def = getAchievementDefinition(id);
        if (!def) return null;
        toastCounter += 1;
        return { key: `${id}-${toastCounter}`, title: def.title, description: def.description };
      })
      .filter((t): t is ToastItem => t !== null);

    if (newToasts.length === 0) return;

    setToasts((prev) => [...prev, ...newToasts]);
    newToasts.forEach((toast) => {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.key !== toast.key));
      }, 4000);
    });
  }, [unlockedIds]);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.host} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.key} className={styles.toast}>
          <span className={styles.icon} aria-hidden="true">
            🏆
          </span>
          <div>
            <p className={styles.title}>Новое достижение: {toast.title}</p>
            <p className={styles.description}>{toast.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
