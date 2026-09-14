import type { PersistedSession } from "../game/types";

/**
 * Persists the in-progress quiz session (separate from StoredProgress, which
 * only holds completed attempts/statistics/achievements) so a page reload
 * mid-quiz can resume exactly where the player left off — same questions,
 * same order, same score/streak/mistakes, same time remaining on the current
 * question.
 */
export const SESSION_STORAGE_KEY = "history-quiz:session:v1";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidSessionShape(value: unknown): value is PersistedSession {
  if (!isPlainObject(value)) return false;
  if (value.version !== 1) return false;
  if (value.mode !== "lives" && value.mode !== "god" && value.mode !== "custom") return false;
  if (typeof value.stage !== "string") return false;
  if (typeof value.currentLevel !== "number") return false;
  if (!Array.isArray(value.levelQuestions)) return false;
  if (typeof value.questionIndex !== "number") return false;
  if (!Array.isArray(value.levelOutcomes)) return false;
  if (typeof value.score !== "number") return false;
  return true;
}

/** Safely writes the session snapshot. Never throws (e.g. storage full/disabled). */
export function saveSession(session: PersistedSession): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Best-effort only: losing the resume snapshot is not fatal.
  }
}

/**
 * Safely reads a persisted session. Returns null on any problem (missing
 * key, invalid JSON, unexpected shape, storage unavailable) — the caller
 * falls back to a fresh game state, exactly like `loadProgress()` does for
 * long-term progress.
 */
export function loadSession(): PersistedSession | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSessionShape(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Clears the persisted session (run finished, abandoned, or never started). */
export function clearSession(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore: nothing useful to do if storage access itself throws.
  }
}
