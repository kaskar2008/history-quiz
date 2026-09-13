import type { GameMode, QuizFilters, RecordEntry, StoredProgress } from "../game/types";

/**
 * Builds a stable record key from mode + filters. Arrays are sorted so that
 * equivalent filter selections (regardless of insertion order) map to the same key.
 */
export function buildRecordKey(mode: GameMode, filters: QuizFilters): string {
  const sortedCountries = [...filters.countries].sort();
  const sortedRegions = [...filters.regions].sort();
  const sortedPeriods = [...filters.periods].sort();
  const sortedTopics = [...filters.topics].sort();

  return [
    mode,
    filters.scope,
    sortedCountries.join(","),
    sortedRegions.join(","),
    sortedPeriods.join(","),
    sortedTopics.join(","),
  ].join("|");
}

export function getRecord(progress: StoredProgress, key: string): RecordEntry | null {
  return progress.records[key] ?? null;
}

/**
 * Determines whether `score` beats the existing record for this key.
 * An equal score is NOT a new record. The very first completed attempt for a
 * key always sets the record (there is nothing to beat).
 */
export function isNewRecord(previousRecord: RecordEntry | null, score: number): boolean {
  if (previousRecord === null) {
    return true;
  }
  return score > previousRecord.score;
}

/** Returns a new progress object with the record for `key` updated, if `score` qualifies. */
export function withUpdatedRecord(
  progress: StoredProgress,
  key: string,
  mode: GameMode,
  score: number,
  achievedAt: string,
): StoredProgress {
  const previous = getRecord(progress, key);
  if (!isNewRecord(previous, score)) {
    return progress;
  }
  return {
    ...progress,
    records: {
      ...progress.records,
      [key]: { key, score, mode, achievedAt },
    },
  };
}
