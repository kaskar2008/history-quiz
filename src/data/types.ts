/**
 * Data-layer types describing the question bank content itself.
 * Kept separate from game/types.ts (which describes runtime game state)
 * so that content shape and game logic can evolve independently.
 */

export type Region =
  | "europe"
  | "asia"
  | "africa"
  | "north-america"
  | "south-america"
  | "middle-east"
  | "oceania";

export type Period =
  | "prehistory"
  | "ancient"
  | "middle-ages"
  | "early-modern"
  | "18-century"
  | "19-century"
  | "world-war-1"
  | "interwar"
  | "world-war-2"
  | "cold-war"
  | "contemporary";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  /** Stable unique identifier, e.g. "world-ancient-egypt-001" */
  id: string;
  /** Which of the 10 quiz levels this question belongs to (must match its file). */
  level: number;
  /**
   * Fine-grained difficulty score used to order the 30 questions picked for a
   * playthrough from easiest to hardest. Independent from `level`: many
   * questions in the same level file can share a `difficulty` value, but each
   * level's pool should contain at least 30 distinct values so a random
   * selection sorts into a meaningful progression. Values are spaced widely
   * (multiples of 10) on purpose, leaving room to insert new questions later
   * without renumbering existing ones.
   */
  difficulty: number;
  /** Short question text, ideally under ~160 characters */
  question: string;
  /** Optional extra context shown via the "i" button. Must be null if not needed. */
  details: string | null;
  /** Exactly four options */
  options: QuestionOption[];
  /** Must match one of options[].id */
  correctOptionId: string;
  /** 1-3 short sentences shown after answering */
  explanation: string;
  /** One or more country/entity slugs (modern countries or historical polities) */
  countries: string[];
  /** Primary region */
  region: Region;
  /** Historical period */
  period: Period;
  /** Thematic tags */
  topics: string[];
  /** Approximate year range, negative numbers mean BCE */
  yearFrom: number;
  yearTo: number;
}

export interface LevelIndexEntry {
  level: number;
  title: string;
  file: string;
  questionCount: number;
}

export interface QuestionsIndex {
  version: number;
  levels: LevelIndexEntry[];
}

export interface DictionaryEntry {
  id: string;
  label: string;
}

export interface Dictionaries {
  countries: DictionaryEntry[];
  regions: DictionaryEntry[];
  periods: DictionaryEntry[];
  topics: DictionaryEntry[];
}
