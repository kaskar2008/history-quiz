import { achievements } from "../game/config";
import type { GameMode, StoredProgress } from "../game/types";

export interface LevelCompletionFacts {
  level: number;
  mistakesInLevel: number;
  stars: 0 | 1 | 2 | 3;
}

export interface RunCompletionFacts {
  mode: GameMode;
  finishReason: "completed" | "too-many-mistakes" | "abandoned";
  highestLevelReached: number;
  totalLevels: number;
}

/**
 * Given already-known facts about what just happened, returns the list of
 * achievement ids that should newly unlock (excluding ones already owned).
 * Pure function: takes current progress + facts, returns ids only — the
 * caller is responsible for persisting them.
 */
export function checkLevelAchievements(
  progress: StoredProgress,
  facts: LevelCompletionFacts,
  maxStreakInLevel: number,
): string[] {
  const owned = new Set(progress.achievements);
  const unlocked: string[] = [];

  const unlock = (id: string) => {
    if (!owned.has(id) && !unlocked.includes(id)) {
      unlocked.push(id);
    }
  };

  if (facts.level === 1) {
    unlock("first-step");
  }
  if (facts.mistakesInLevel === 0) {
    unlock("flawless");
  }
  if (maxStreakInLevel >= 10) {
    unlock("streak-10");
  }
  if (facts.level === 5) {
    unlock("halfway");
  }

  return unlocked;
}

export function checkRunAchievements(progress: StoredProgress, facts: RunCompletionFacts): string[] {
  const owned = new Set(progress.achievements);
  const unlocked: string[] = [];

  const unlock = (id: string) => {
    if (!owned.has(id) && !unlocked.includes(id)) {
      unlocked.push(id);
    }
  };

  if (facts.finishReason === "completed" && facts.highestLevelReached >= facts.totalLevels) {
    unlock("history-connoisseur");
  }
  if (facts.mode === "lives" && facts.finishReason === "completed") {
    unlock("unstoppable");
  }

  return unlocked;
}

/** Checks the "three stars on every level" achievement against the full bestLevelResults map. */
export function checkKeeperOfTimeAchievement(
  progress: StoredProgress,
  mode: GameMode,
  totalLevels: number,
): string[] {
  if (progress.achievements.includes("keeper-of-time")) {
    return [];
  }
  const results = progress.bestLevelResults[mode];
  for (let level = 1; level <= totalLevels; level += 1) {
    const result = results[String(level)];
    if (!result || result.stars < 3) {
      return [];
    }
  }
  return ["keeper-of-time"];
}

export function getAchievementDefinition(id: string) {
  return achievements.find((achievement) => achievement.id === id) ?? null;
}
