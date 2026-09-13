import { Button } from "../components/Button";
import { PageContainer } from "../components/PageContainer";
import type { GameMode } from "../game/types";
import styles from "./ModeSelectionScreen.module.css";

interface ModeSelectionScreenProps {
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

export function ModeSelectionScreen({ onSelect, onBack }: ModeSelectionScreenProps) {
  return (
    <PageContainer>
      <button type="button" className={styles.backLink} onClick={onBack}>
        ← На главную
      </button>
      <h1 className={styles.title}>Выберите режим игры</h1>

      <div className={styles.modes}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>🛡 Режим «Жизни»</h2>
          <p className={styles.cardText}>
            Разрешено пять ошибок. Первые пять не заканчивают игру, а вот шестая — завершает попытку
            немедленно. Проверьте, как далеко вы сможете зайти.
          </p>
          <Button variant="primary" fullWidth onClick={() => onSelect("lives")}>
            Играть в «Жизни»
          </Button>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>♾ Режим «Бог»</h2>
          <p className={styles.cardText}>
            Ошибки не ограничены и не завершают игру — вы можете спокойно пройти все десять уровней,
            изучая историю без давления.
          </p>
          <Button variant="primary" fullWidth onClick={() => onSelect("god")}>
            Играть в «Бог»
          </Button>
        </article>
      </div>
    </PageContainer>
  );
}
