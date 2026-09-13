import { useRef, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import styles from "./InfoButton.module.css";

interface InfoButtonProps {
  details: string;
}

export function InfoButton({ details }: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.infoButton}
        onClick={() => setIsOpen(true)}
        aria-label="Подробнее о вопросе"
      >
        i
      </button>
      <BottomSheet
        isOpen={isOpen}
        title="Подробнее о вопросе"
        onClose={() => setIsOpen(false)}
        returnFocusRef={buttonRef}
      >
        <p>{details}</p>
      </BottomSheet>
    </>
  );
}
