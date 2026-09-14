import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import styles from "./SavePresetDialog.module.css";

interface SavePresetDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (name: string) => void;
}

/** Prompts for a name to save the current custom-mode configuration under. */
export function SavePresetDialog({ isOpen, onCancel, onSave }: SavePresetDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) setName("");
  }, [isOpen]);

  const trimmedName = name.trim();

  function handleSave() {
    if (!trimmedName) return;
    onSave(trimmedName);
  }

  return (
    <BottomSheet isOpen={isOpen} title="Сохранить пресет" onClose={onCancel}>
      <label className={styles.label} htmlFor="preset-name-input">
        Название пресета
      </label>
      <input
        id="preset-name-input"
        type="text"
        className={styles.input}
        placeholder="Например, «Античность»"
        value={name}
        maxLength={60}
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
      />
      <div className={styles.actions}>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="primary" fullWidth onClick={handleSave} disabled={!trimmedName}>
          Сохранить
        </Button>
      </div>
    </BottomSheet>
  );
}
