import { PageContainer } from "../components/PageContainer";
import styles from "./LoadingScreen.module.css";

interface LoadingScreenProps {
  level: number;
  onRequestExit: () => void;
}

export function LoadingScreen({ level, onRequestExit }: LoadingScreenProps) {
  return (
    <PageContainer>
      <button type="button" className={styles.backLink} onClick={onRequestExit}>
        ← Выйти из игры
      </button>
      <div className={styles.wrapper} role="status" aria-live="polite">
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.text}>Загружаем уровень {level}…</p>
      </div>
    </PageContainer>
  );
}
