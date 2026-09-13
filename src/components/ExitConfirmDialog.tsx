import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import styles from "./ExitConfirmDialog.module.css";

interface ExitConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Warns before quitting an in-progress attempt: leaving now discards this
 * run's progress instead of counting as a proper finish, so the player
 * should get a chance to change their mind.
 */
export function ExitConfirmDialog({ isOpen, onCancel, onConfirm, returnFocusRef }: ExitConfirmDialogProps) {
  return (
    <BottomSheet isOpen={isOpen} title="Выйти из игры?" onClose={onCancel} returnFocusRef={returnFocusRef}>
      <p className={styles.message}>
        Текущая попытка не будет засчитана в статистику и рекорды — прогресс этого прохождения
        потеряется. Уже пройденные уровни и полученные достижения останутся сохранёнными.
      </p>
      <div className={styles.actions}>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Остаться
        </Button>
        <Button variant="danger" fullWidth onClick={onConfirm}>
          Выйти без сохранения
        </Button>
      </div>
    </BottomSheet>
  );
}
