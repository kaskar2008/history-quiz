import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

/** Generic yes/no confirmation sheet for actions worth a second thought (e.g. deleting a preset). */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = "Отмена",
  onCancel,
  onConfirm,
  returnFocusRef,
}: ConfirmDialogProps) {
  return (
    <BottomSheet isOpen={isOpen} title={title} onClose={onCancel} returnFocusRef={returnFocusRef}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" fullWidth onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
