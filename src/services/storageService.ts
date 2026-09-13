import type {
  AttemptResult,
  BestLevelResult,
  GameMode,
  LevelOutcome,
  ModeStatistics,
  StoredProgress,
} from "../game/types";
import { createEmptyProgress } from "../game/types";

export const STORAGE_KEY = "history-quiz:progress:v1";
export const CURRENT_VERSION = 1;
export const MAX_STORED_ATTEMPTS = 100;

function isModeStatistics(value: unknown): value is ModeStatistics {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.bestScore === "number" &&
    typeof v.bestLevel === "number" &&
    typeof v.totalAttempts === "number" &&
    typeof v.completedRuns === "number" &&
    typeof v.totalCorrectAnswers === "number" &&
    typeof v.totalWrongAnswers === "number"
  );
}

function isAttemptResult(value: unknown): value is AttemptResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.completedAt === "string" &&
    (v.mode === "lives" || v.mode === "god") &&
    typeof v.score === "number" &&
    typeof v.correctAnswers === "number" &&
    typeof v.wrongAnswers === "number" &&
    typeof v.answeredQuestions === "number" &&
    typeof v.highestLevelReached === "number" &&
    typeof v.maxStreak === "number"
  );
}

/**
 * Validates that a parsed JSON value has the shape we expect from StoredProgress.
 * Deliberately conservative: any structural mismatch is treated as corruption.
 */
function isValidProgressShape(value: unknown): value is StoredProgress {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  if (v.version !== CURRENT_VERSION) return false;
  if (!Array.isArray(v.attempts) || !v.attempts.every(isAttemptResult)) return false;
  if (typeof v.statistics !== "object" || v.statistics === null) return false;
  const stats = v.statistics as Record<string, unknown>;
  if (!isModeStatistics(stats.lives) || !isModeStatistics(stats.god)) return false;
  if (typeof v.bestLevelResults !== "object" || v.bestLevelResults === null) return false;
  if (!Array.isArray(v.achievements) || !v.achievements.every((a) => typeof a === "string")) {
    return false;
  }
  if (typeof v.records !== "object" || v.records === null) return false;

  return true;
}

/**
 * Safely reads progress from localStorage. Never throws: on any error (missing
 * key, invalid JSON, unexpected shape, unsupported version, storage unavailable)
 * it falls back to a fresh empty progress object.
 */
export function loadProgress(): StoredProgress {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return createEmptyProgress();
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyProgress();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidProgressShape(parsed)) {
      return createEmptyProgress();
    }
    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

/** Safely writes progress to localStorage. Returns true on success, false if storage failed. */
export function saveProgress(progress: StoredProgress): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const trimmed: StoredProgress = {
      ...progress,
      attempts: progress.attempts.slice(-MAX_STORED_ATTEMPTS),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    return false;
  }
}

function updateModeStatistics(
  stats: ModeStatistics,
  attempt: AttemptResult,
): ModeStatistics {
  return {
    bestScore: Math.max(stats.bestScore, attempt.score),
    bestLevel: Math.max(stats.bestLevel, attempt.highestLevelReached),
    totalAttempts: stats.totalAttempts + 1,
    completedRuns: stats.completedRuns + (attempt.finishReason === "completed" ? 1 : 0),
    totalCorrectAnswers: stats.totalCorrectAnswers + attempt.correctAnswers,
    totalWrongAnswers: stats.totalWrongAnswers + attempt.wrongAnswers,
  };
}

function mergeBestLevelResults(
  existing: Record<string, BestLevelResult>,
  outcomes: LevelOutcome[],
): Record<string, BestLevelResult> {
  const next = { ...existing };
  for (const outcome of outcomes) {
    const key = String(outcome.level);
    const current = next[key];
    if (!current || outcome.score > current.score) {
      next[key] = { score: outcome.score, stars: outcome.stars };
    } else if (outcome.stars > current.stars) {
      next[key] = { score: current.score, stars: outcome.stars };
    }
  }
  return next;
}

/**
 * Pure merge of a finished attempt into progress: appends the attempt (history
 * trimming happens at save time), updates per-mode aggregate statistics, and
 * merges per-level best score/stars. Does not touch achievements or records —
 * those are applied separately via addAchievements / recordService.
 */
export function applyAttemptToProgress(
  progress: StoredProgress,
  attempt: AttemptResult,
  levelOutcomes: LevelOutcome[],
  mode: GameMode,
): StoredProgress {
  return {
    ...progress,
    attempts: [...progress.attempts, attempt],
    statistics: {
      ...progress.statistics,
      [mode]: updateModeStatistics(progress.statistics[mode], attempt),
    },
    bestLevelResults: {
      ...progress.bestLevelResults,
      [mode]: mergeBestLevelResults(progress.bestLevelResults[mode], levelOutcomes),
    },
  };
}

/** Pure helper to add newly unlocked achievement ids (deduplicated). */
export function addAchievements(progress: StoredProgress, newIds: string[]): StoredProgress {
  if (newIds.length === 0) return progress;
  const set = new Set(progress.achievements);
  for (const id of newIds) set.add(id);
  return { ...progress, achievements: Array.from(set) };
}
