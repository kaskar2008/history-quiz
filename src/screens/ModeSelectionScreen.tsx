import { useState } from "react";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageContainer } from "../components/PageContainer";
import type { CustomPreset, GameMode } from "../game/types";
import { deletePreset, describeCustomPreset, loadPresets } from "../services/presetService";
import styles from "./ModeSelectionScreen.module.css";

interface ModeSelectionScreenProps {
  onSelect: (mode: Exclude<GameMode, "custom">) => void;
  onSelectCustom: () => void;
  onSelectPreset: (preset: CustomPreset) => void;
  onBack: () => void;
}

export function ModeSelectionScreen({ onSelect, onSelectCustom, onSelectPreset, onBack }: ModeSelectionScreenProps) {
  const [presets, setPresets] = useState<CustomPreset[]>(() => loadPresets());
  const [presetPendingDelete, setPresetPendingDelete] = useState<CustomPreset | null>(null);

  function handleConfirmDelete() {
    if (!presetPendingDelete) return;
    setPresets(deletePreset(presetPendingDelete.id));
    setPresetPendingDelete(null);
  }

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

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>🎛 Кастом</h2>
          <p className={styles.cardText}>
            Настройте квиз под себя: группировка по периоду или стране, число вопросов, перемешивание и
            время на ответ.
          </p>
          <Button variant="primary" fullWidth onClick={onSelectCustom}>
            Настроить игру
          </Button>
        </article>
      </div>

      {presets.length > 0 && (
        <section className={styles.presetSection}>
          <h2 className={styles.presetSectionTitle}>Ваши пресеты</h2>
          <ul className={styles.presetList}>
            {presets.map((preset) => (
              <li key={preset.id} className={styles.presetItem}>
                <div className={styles.presetInfo}>
                  <span className={styles.presetName}>{preset.name}</span>
                  <span className={styles.presetMeta}>{describeCustomPreset(preset)}</span>
                </div>
                <div className={styles.presetActions}>
                  <Button variant="secondary" onClick={() => onSelectPreset(preset)}>
                    Играть
                  </Button>
                  <button
                    type="button"
                    className={styles.presetDelete}
                    aria-label={`Удалить пресет «${preset.name}»`}
                    onClick={() => setPresetPendingDelete(preset)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        isOpen={presetPendingDelete !== null}
        title="Удалить пресет?"
        message={`Пресет «${presetPendingDelete?.name ?? ""}» будет удалён без возможности восстановления.`}
        confirmLabel="Удалить"
        onCancel={() => setPresetPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </PageContainer>
  );
}
