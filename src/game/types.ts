import type { Period, Question, Region } from "../data/types";

export type GameMode = "lives" | "god";

export type QuizScope = "world" | "country" | "region";

export interface QuizFilters {
  scope: QuizScope;
  countries: string[];
  regions: Region[];
  periods: Period[];
  topics: string[];
}

export const defaultFilters: QuizFilters = {
  scope: "world",
  countries: [],
  regions: [],
  periods: [],
  topics: [],
};

/** Finite set of stages the game reducer can be in. */
export type GameStage =
  | "home"
  | "mode-selection"
  | "level-map"
  | "loading"
  | "question"
  | "answer-result"
  | "level-result"
  | "game-result";

export type FinishReason = "completed" | "too-many-mistakes" | "abandoned";

export interface LevelOutcome {
  level: number;
  correct: number;
  wrong: number;
  total: number;
  score: number;
  maxStreak: number;
  stars: 0 | 1 | 2 | 3;
}

export interface AttemptResult {
  id: string;
  completedAt: string;
  mode: GameMode;
  scope: QuizScope;
  countries: string[];
  regions: string[];
  periods: string[];
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredQuestions: number;
  highestLevelReached: number;
  maxStreak: number;
  finishReason: FinishReason;
}

export interface ModeStatistics {
  bestScore: number;
  bestLevel: number;
  totalAttempts: number;
  completedRuns: number;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
}

export function createEmptyModeStatistics(): ModeStatistics {
  return {
    bestScore: 0,
    bestLevel: 0,
    totalAttempts: 0,
    completedRuns: 0,
    totalCorrectAnswers: 0,
    totalWrongAnswers: 0,
  };
}

export interface BestLevelResult {
  score: number;
  stars: 0 | 1 | 2 | 3;
}

export interface RecordEntry {
  key: string;
  score: number;
  mode: GameMode;
  achievedAt: string;
}

export interface StoredProgress {
  version: 1;
  attempts: AttemptResult[];
  statistics: Record<GameMode, ModeStatistics>;
  bestLevelResults: Record<GameMode, Record<string, BestLevelResult>>;
  achievements: string[];
  records: Record<string, RecordEntry>;
}

export function createEmptyProgress(): StoredProgress {
  return {
    version: 1,
    attempts: [],
    statistics: {
      lives: createEmptyModeStatistics(),
      god: createEmptyModeStatistics(),
    },
    bestLevelResults: { lives: {}, god: {} },
    achievements: [],
    records: {},
  };
}

/** Runtime state of an in-progress quiz session, managed by the reducer. */
export interface GameState {
  stage: GameStage;
  mode: GameMode | null;
  filters: QuizFilters;
  currentLevel: number;
  levelQuestions: Question[];
  questionIndex: number;
  selectedOptionId: string | null;
  isAnswerLocked: boolean;
  /** True when the current answer-result was reached because the 20s timer ran out, not a click. */
  timedOut: boolean;
  /** Epoch ms when the current question's timer expires; null while not actively counting down. */
  questionDeadlineAt: number | null;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredQuestions: number;
  currentStreak: number;
  maxStreak: number;
  mistakesInLevel: number;
  totalMistakes: number;
  levelOutcomes: LevelOutcome[];
  finishReason: FinishReason | null;
  newAchievements: string[];
  isNewRecord: boolean;
  previousRecordScore: number | null;
  error: string | null;
}

/**
 * Stages worth persisting so a page reload can resume an in-progress attempt.
 * "home", "mode-selection" and "game-result" are intentionally excluded:
 * there is either no progress to lose yet, or (for game-result) the run's
 * completion side effects have already been applied, so restoring into it
 * again on reload would risk double-counting stats/achievements.
 */
export const RESUMABLE_STAGES: readonly GameStage[] = [
  "level-map",
  "loading",
  "question",
  "answer-result",
  "level-result",
];

export function isResumableStage(stage: GameStage): boolean {
  return RESUMABLE_STAGES.includes(stage);
}

/**
 * Serializable snapshot of the fields needed to resume an in-progress
 * attempt after a page reload. Deliberately narrower than GameState: purely
 * transient/display fields (error, newAchievements, record info, finish
 * reason) are not persisted and reset to defaults on restore.
 */
export interface PersistedSession {
  version: 1;
  stage: GameStage;
  mode: GameMode;
  filters: QuizFilters;
  currentLevel: number;
  levelQuestions: Question[];
  questionIndex: number;
  selectedOptionId: string | null;
  isAnswerLocked: boolean;
  timedOut: boolean;
  questionDeadlineAt: number | null;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  answeredQuestions: number;
  currentStreak: number;
  maxStreak: number;
  mistakesInLevel: number;
  totalMistakes: number;
  levelOutcomes: LevelOutcome[];
}

export function toPersistedSession(state: GameState): PersistedSession | null {
  if (!state.mode || !isResumableStage(state.stage)) return null;
  return {
    version: 1,
    stage: state.stage,
    mode: state.mode,
    filters: state.filters,
    currentLevel: state.currentLevel,
    levelQuestions: state.levelQuestions,
    questionIndex: state.questionIndex,
    selectedOptionId: state.selectedOptionId,
    isAnswerLocked: state.isAnswerLocked,
    timedOut: state.timedOut,
    questionDeadlineAt: state.questionDeadlineAt,
    score: state.score,
    correctAnswers: state.correctAnswers,
    wrongAnswers: state.wrongAnswers,
    answeredQuestions: state.answeredQuestions,
    currentStreak: state.currentStreak,
    maxStreak: state.maxStreak,
    mistakesInLevel: state.mistakesInLevel,
    totalMistakes: state.totalMistakes,
    levelOutcomes: state.levelOutcomes,
  };
}

export function fromPersistedSession(session: PersistedSession): GameState {
  return {
    stage: session.stage,
    mode: session.mode,
    filters: session.filters,
    currentLevel: session.currentLevel,
    levelQuestions: session.levelQuestions,
    questionIndex: session.questionIndex,
    selectedOptionId: session.selectedOptionId,
    isAnswerLocked: session.isAnswerLocked,
    timedOut: session.timedOut,
    questionDeadlineAt: session.questionDeadlineAt,
    score: session.score,
    correctAnswers: session.correctAnswers,
    wrongAnswers: session.wrongAnswers,
    answeredQuestions: session.answeredQuestions,
    currentStreak: session.currentStreak,
    maxStreak: session.maxStreak,
    mistakesInLevel: session.mistakesInLevel,
    totalMistakes: session.totalMistakes,
    levelOutcomes: session.levelOutcomes,
    finishReason: null,
    newAchievements: [],
    isNewRecord: false,
    previousRecordScore: null,
    error: null,
  };
}

export const MAX_LIVES_MISTAKES = 5;
export const QUESTIONS_PER_LEVEL = 30;
export const TOTAL_LEVELS = 10;
/** Seconds allowed to answer a single question before it auto-resolves as wrong. */
export const QUESTION_TIME_LIMIT_SECONDS = 20;
