import type { Question, QuestionsIndex } from "../data/types";
import type { QuizFilters } from "../game/types";
import questionsIndexData from "../data/questions/index.json";

/**
 * Level question banks are NOT bundled into the initial JS payload. Each file
 * is loaded on demand via a dynamic import, matching the "load levels
 * separately" requirement. `import.meta.glob` lets Vite code-split each
 * level file into its own chunk while keeping this module statically
 * analyzable.
 */
const levelModules = import.meta.glob<{ default: Question[] }>(
  "../data/questions/level-*.json",
);

export function getQuestionsIndex(): QuestionsIndex {
  return questionsIndexData as QuestionsIndex;
}

function resolveLevelPath(level: number): string {
  const padded = String(level).padStart(2, "0");
  return `../data/questions/level-${padded}.json`;
}

const levelCache = new Map<number, Question[]>();
const inFlight = new Map<number, Promise<Question[]>>();

/** Loads (and caches) the full question bank for one level. */
export async function loadLevelQuestions(level: number): Promise<Question[]> {
  const cached = levelCache.get(level);
  if (cached) return cached;

  const existing = inFlight.get(level);
  if (existing) return existing;

  const path = resolveLevelPath(level);
  const loader = levelModules[path];
  if (!loader) {
    throw new Error(`Нет данных для уровня ${level}`);
  }

  const promise = loader().then((mod) => {
    const questions = mod.default;
    levelCache.set(level, questions);
    inFlight.delete(level);
    return questions;
  });
  inFlight.set(level, promise);
  return promise;
}

/** Best-effort background prefetch; failures are swallowed since this is purely an optimization. */
export function prefetchLevelQuestions(level: number): void {
  if (level < 1 || level > getQuestionsIndex().levels.length) return;
  void loadLevelQuestions(level).catch(() => {
    /* prefetch is optional, ignore errors here */
  });
}

let allQuestionsPromise: Promise<Question[]> | null = null;

/**
 * Loads and combines every level's question bank into one pool, deduplicated
 * by id. Used by "custom" mode, which groups/filters across the whole game
 * rather than a single level file. Cached module-wide (same underlying
 * per-level cache as loadLevelQuestions, so this costs nothing extra once the
 * normal game has already visited every level).
 */
export function loadAllQuestions(): Promise<Question[]> {
  if (!allQuestionsPromise) {
    const levels = getQuestionsIndex().levels.map((entry) => entry.level);
    allQuestionsPromise = Promise.all(levels.map((level) => loadLevelQuestions(level)))
      .then((lists) => Array.from(new Map(lists.flat().map((q) => [q.id, q])).values()))
      .catch((err: unknown) => {
        allQuestionsPromise = null;
        throw err;
      });
  }
  return allQuestionsPromise;
}

/** Per-level cap for a custom run: the matching pool split evenly across its levels. */
export function getMaxQuestionsPerLevel(filteredCount: number, levelCount: number): number {
  if (levelCount <= 0) return 0;
  return Math.max(1, Math.floor(filteredCount / levelCount));
}

/**
 * Filters a question pool by the current QuizFilters. Currently the app only
 * ships "world" scope content, but this keeps the selection logic ready for
 * country/region filtering without changes to callers.
 */
export function filterQuestions(questions: Question[], filters: QuizFilters): Question[] {
  return questions.filter((q) => {
    if (filters.regions.length > 0 && !filters.regions.includes(q.region)) {
      return false;
    }
    if (filters.periods.length > 0 && !filters.periods.includes(q.period)) {
      return false;
    }
    if (filters.topics.length > 0 && !q.topics.some((t) => filters.topics.includes(t))) {
      return false;
    }
    if (
      filters.countries.length > 0 &&
      !q.countries.some((c) => filters.countries.includes(c))
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Deterministic Fisher-Yates shuffle driven by an injectable random source,
 * so selection is unit-testable without relying on Math.random.
 */
export function shuffle<T>(items: T[], randomFn: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Selects `count` unique questions from the pool (no repeats within the
 * selection). Which questions get picked is always random; `shuffleOrder`
 * controls how the selection is then presented: false (the default, matching
 * every mode except a custom run with shuffling enabled) sorts by
 * `difficulty` ascending so a playthrough progresses from easier to harder;
 * true keeps the random selection order instead. If the pool has fewer than
 * `count` questions, the whole pool is used.
 *
 * Growing the pool (adding more questions to a level over time) works
 * automatically: new questions just need a `difficulty` value to slot into
 * the existing progression, no other changes required.
 */
export function selectQuestionsForLevel(
  pool: Question[],
  count: number,
  randomFn: () => number = Math.random,
  shuffleOrder: boolean = false,
): Question[] {
  const uniqueById = Array.from(new Map(pool.map((q) => [q.id, q])).values());
  const shuffled = shuffle(uniqueById, randomFn);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));
  return shuffleOrder ? picked : picked.sort((a, b) => a.difficulty - b.difficulty);
}
