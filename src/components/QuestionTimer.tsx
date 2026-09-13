import { useEffect, useRef, useState } from "react";
import styles from "./QuestionTimer.module.css";

interface QuestionTimerProps {
  /** Epoch ms when this question's timer expires — an absolute deadline rather
   * than a fixed duration, so the remaining time survives a page reload:
   * recompute it from `deadlineAt - Date.now()` instead of restarting a fresh
   * countdown. */
  deadlineAt: number;
  totalDurationSeconds: number;
  onExpire: () => void;
}

function secondsUntil(deadlineAt: number): number {
  return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
}

/**
 * Countdown bar for the current question. The parent must mount a fresh
 * instance per question (e.g. `key={question.id}`) and unmount it once the
 * question is answered — that naturally stops the timer, which is simpler
 * and more robust than juggling a pause/resume flag.
 *
 * Because it derives remaining time from an absolute deadline rather than a
 * local counter, restoring a persisted session (e.g. after a page reload)
 * just works: if the deadline already passed while the page was closed, it
 * expires immediately on mount instead of granting a fresh 20 seconds.
 */
export function QuestionTimer({ deadlineAt, totalDurationSeconds, onExpire }: QuestionTimerProps) {
  const initialSecondsLeft = secondsUntil(deadlineAt);
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);
  const [barShrunk, setBarShrunk] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (initialSecondsLeft <= 0) {
      onExpireRef.current();
      return;
    }

    // Kick off the CSS width transition on the next frame so the browser
    // registers the starting width first.
    const raf = requestAnimationFrame(() => setBarShrunk(true));

    const interval = setInterval(() => {
      const remaining = secondsUntil(deadlineAt);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
    // Runs once per mount; a new question (or a restored deadline) remounts
    // this component via `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLow = secondsLeft <= 5;
  const initialWidthPercent = Math.min(100, (initialSecondsLeft / totalDurationSeconds) * 100);

  return (
    <div
      className={styles.wrapper}
      role="timer"
      aria-label={`Осталось времени на ответ: ${secondsLeft} секунд`}
    >
      <div className={styles.track}>
        <div
          className={[styles.fill, isLow ? styles.fillLow : ""].join(" ")}
          style={{
            width: barShrunk ? "0%" : `${initialWidthPercent}%`,
            transitionDuration: barShrunk ? `${initialSecondsLeft}s` : "0s",
          }}
        />
      </div>
      <span className={[styles.seconds, isLow ? styles.secondsLow : ""].join(" ")} aria-hidden="true">
        {secondsLeft}с
      </span>
    </div>
  );
}
