import styles from "./OptionButton.module.css";

export type OptionState = "idle" | "selected" | "correct" | "incorrect" | "disabled";

interface OptionButtonProps {
  label: string;
  optionLetter: string;
  state: OptionState;
  onClick: () => void;
}

export function OptionButton({ label, optionLetter, state, onClick }: OptionButtonProps) {
  const classes = [styles.option, styles[state]].join(" ");
  const isInteractive = state === "idle";

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={!isInteractive}
      aria-pressed={state === "selected" || state === "correct" || state === "incorrect"}
    >
      <span className={styles.letter} aria-hidden="true">
        {optionLetter}
      </span>
      <span className={styles.text}>{label}</span>
      {state === "correct" && (
        <span className={styles.icon} aria-hidden="true">
          ✓
        </span>
      )}
      {state === "incorrect" && (
        <span className={styles.icon} aria-hidden="true">
          ✕
        </span>
      )}
      {state === "correct" && <span className={styles.srOnly}>Правильный ответ</span>}
      {state === "incorrect" && <span className={styles.srOnly}>Неверный ответ</span>}
    </button>
  );
}
