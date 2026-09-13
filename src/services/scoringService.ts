import { ranks, scoringConfig, starThresholds, type RankDefinition } from "../game/config";

/**
 * Pure scoring functions. No side effects, no randomness — safe to unit test directly.
 */

/** Returns the streak bonus per correct answer for a given streak length (after incrementing). */
export function getStreakBonusPerAnswer(streakLength: number): number {
  let bonus = 0;
  for (const tier of scoringConfig.streakBonusTiers) {
    if (streakLength >= tier.minStreak) {
      bonus = tier.bonusPerAnswer;
    }
  }
  return bonus;
}

/** Points awarded for a single answer, including any streak bonus. streakLength is the streak AFTER this answer. */
export function getAnswerPoints(isCorrect: boolean, streakLength: number): number {
  if (!isCorrect) {
    return scoringConfig.wrongAnswerPoints;
  }
  return scoringConfig.correctAnswerPoints + getStreakBonusPerAnswer(streakLength);
}

/** Bonus points for finishing a level, depending on whether it was mistake-free. */
export function getLevelCompletionBonus(mistakesInLevel: number): number {
  return mistakesInLevel === 0
    ? scoringConfig.levelCompletionBonus + scoringConfig.perfectLevelBonus
    : scoringConfig.levelCompletionBonus;
}

/** Star rating (0-3) for a completed level based on accuracy. Level must actually be completed to earn any star. */
export function getStarsForLevel(correct: number, total: number, completed: boolean): 0 | 1 | 2 | 3 {
  if (!completed || total <= 0) {
    return 0;
  }
  const accuracy = correct / total;
  if (accuracy >= starThresholds.threeStarMinAccuracy) {
    return 3;
  }
  if (accuracy >= starThresholds.twoStarMinAccuracy) {
    return 2;
  }
  return 1;
}

/** Highest rank whose threshold the given score meets or exceeds. */
export function getRankForScore(score: number): RankDefinition {
  let current = ranks[0];
  for (const rank of ranks) {
    if (score >= rank.minScore) {
      current = rank;
    }
  }
  return current;
}
