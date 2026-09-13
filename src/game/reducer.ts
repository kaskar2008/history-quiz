import type { Question } from "../data/types";
import { getAnswerPoints, getLevelCompletionBonus, getStarsForLevel } from "../services/scoringService";
import { gameRules } from "./config";
import {
  defaultFilters,
  MAX_LIVES_MISTAKES,
  QUESTION_TIME_LIMIT_SECONDS,
  QUESTIONS_PER_LEVEL,
  TOTAL_LEVELS,
  type GameMode,
  type GameState,
  type LevelOutcome,
  type QuizFilters,
} from "./types";

function newQuestionDeadline(): number {
  return Date.now() + QUESTION_TIME_LIMIT_SECONDS * 1000;
}

export function createInitialGameState(): GameState {
  return {
    stage: "home",
    mode: null,
    filters: defaultFilters,
    currentLevel: 1,
    levelQuestions: [],
    questionIndex: 0,
    selectedOptionId: null,
    isAnswerLocked: false,
    timedOut: false,
    questionDeadlineAt: null,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    answeredQuestions: 0,
    currentStreak: 0,
    maxStreak: 0,
    mistakesInLevel: 0,
    totalMistakes: 0,
    levelOutcomes: [],
    finishReason: null,
    newAchievements: [],
    isNewRecord: false,
    previousRecordScore: null,
    error: null,
  };
}

export type GameAction =
  | { type: "GO_HOME" }
  | { type: "GO_TO_MODE_SELECTION" }
  | { type: "SELECT_MODE"; mode: GameMode; filters?: QuizFilters; startLevel?: number }
  | { type: "GO_TO_LEVEL_MAP" }
  | { type: "START_LEVEL"; level: number }
  | { type: "LEVEL_LOADED"; questions: Question[] }
  | { type: "LEVEL_LOAD_FAILED"; error: string }
  | { type: "SELECT_ANSWER"; optionId: string }
  | { type: "TIME_EXPIRED" }
  | { type: "NEXT" }
  | { type: "SET_RECORD_INFO"; isNewRecord: boolean; previousRecordScore: number | null }
  | { type: "SET_NEW_ACHIEVEMENTS"; achievements: string[] };

function currentQuestion(state: GameState): Question | null {
  return state.levelQuestions[state.questionIndex] ?? null;
}

/**
 * Shared resolution logic for both a real click (`optionId` set) and a timer
 * expiry (`optionId` is null, always counted as wrong, breaks the streak).
 * Guards against double-processing: a no-op once the stage isn't "question"
 * or the answer is already locked, so a click racing a timeout (or vice
 * versa) can only ever apply once.
 */
function resolveAnswer(state: GameState, optionId: string | null): GameState {
  if (state.stage !== "question" || state.isAnswerLocked) return state;
  const question = currentQuestion(state);
  if (!question) return state;

  const isCorrect = optionId !== null && optionId === question.correctOptionId;
  const nextStreak = isCorrect ? state.currentStreak + 1 : 0;
  const points = getAnswerPoints(isCorrect, nextStreak);

  return {
    ...state,
    stage: "answer-result",
    selectedOptionId: optionId,
    isAnswerLocked: true,
    timedOut: optionId === null,
    questionDeadlineAt: null,
    score: state.score + points,
    correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
    wrongAnswers: state.wrongAnswers + (isCorrect ? 0 : 1),
    answeredQuestions: state.answeredQuestions + 1,
    currentStreak: nextStreak,
    maxStreak: Math.max(state.maxStreak, nextStreak),
    mistakesInLevel: state.mistakesInLevel + (isCorrect ? 0 : 1),
    totalMistakes: state.totalMistakes + (isCorrect ? 0 : 1),
  };
}

function buildLevelOutcome(state: GameState, mistakesInLevel: number, correctInLevel: number, totalInLevel: number, maxStreakInLevel: number, levelScoreDelta: number): LevelOutcome {
  const completed = totalInLevel > 0;
  return {
    level: state.currentLevel,
    correct: correctInLevel,
    wrong: mistakesInLevel,
    total: totalInLevel,
    score: levelScoreDelta,
    maxStreak: maxStreakInLevel,
    stars: getStarsForLevel(correctInLevel, totalInLevel, completed),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "GO_HOME": {
      return createInitialGameState();
    }

    case "GO_TO_MODE_SELECTION": {
      return { ...createInitialGameState(), stage: "mode-selection" };
    }

    case "SELECT_MODE": {
      return {
        ...createInitialGameState(),
        stage: "level-map",
        mode: action.mode,
        filters: action.filters ?? defaultFilters,
        currentLevel: action.startLevel ?? 1,
      };
    }

    case "GO_TO_LEVEL_MAP": {
      return { ...state, stage: "level-map", error: null };
    }

    case "START_LEVEL": {
      return { ...state, stage: "loading", currentLevel: action.level, error: null };
    }

    case "LEVEL_LOADED": {
      if (state.stage !== "loading") return state;
      return {
        ...state,
        stage: "question",
        levelQuestions: action.questions,
        questionIndex: 0,
        selectedOptionId: null,
        isAnswerLocked: false,
        timedOut: false,
        questionDeadlineAt: newQuestionDeadline(),
        mistakesInLevel: 0,
        error: null,
      };
    }

    case "LEVEL_LOAD_FAILED": {
      return { ...state, stage: "level-map", error: action.error };
    }

    case "SELECT_ANSWER": {
      return resolveAnswer(state, action.optionId);
    }

    case "TIME_EXPIRED": {
      return resolveAnswer(state, null);
    }

    case "NEXT": {
      if (state.stage === "answer-result") {
        // Lives mode: the mistake that pushes totalMistakes past the allowed
        // threshold ends the run immediately, once the explanation was shown.
        if (state.mode === "lives" && state.totalMistakes > MAX_LIVES_MISTAKES) {
          return {
            ...state,
            stage: "game-result",
            finishReason: "too-many-mistakes",
          };
        }

        const isLastQuestionInLevel = state.questionIndex >= state.levelQuestions.length - 1;

        if (!isLastQuestionInLevel) {
          return {
            ...state,
            stage: "question",
            questionIndex: state.questionIndex + 1,
            selectedOptionId: null,
            isAnswerLocked: false,
            timedOut: false,
            questionDeadlineAt: newQuestionDeadline(),
          };
        }

        // Level finished: compute this level's outcome and bonus score.
        const totalInLevel = state.levelQuestions.length;
        const correctInLevel = totalInLevel - state.mistakesInLevel;
        const bonus = getLevelCompletionBonus(state.mistakesInLevel);
        const scoreWithBonus = state.score + bonus;
        const outcome = buildLevelOutcome(
          state,
          state.mistakesInLevel,
          correctInLevel,
          totalInLevel,
          state.maxStreak,
          scoreWithBonus - (state.levelOutcomes.reduce((sum, o) => sum + o.score, 0)),
        );

        const nextState: GameState = {
          ...state,
          stage: "level-result",
          score: scoreWithBonus,
          levelOutcomes: [...state.levelOutcomes, outcome],
        };

        if (state.currentLevel >= TOTAL_LEVELS) {
          return { ...nextState, stage: "game-result", finishReason: "completed" };
        }

        return nextState;
      }

      if (state.stage === "level-result") {
        if (state.currentLevel >= TOTAL_LEVELS) {
          return { ...state, stage: "game-result", finishReason: "completed" };
        }
        return { ...state, stage: "loading", currentLevel: state.currentLevel + 1, error: null };
      }

      return state;
    }

    case "SET_RECORD_INFO": {
      return { ...state, isNewRecord: action.isNewRecord, previousRecordScore: action.previousRecordScore };
    }

    case "SET_NEW_ACHIEVEMENTS": {
      return { ...state, newAchievements: action.achievements };
    }

    default:
      return state;
  }
}

export function getQuestionsPerLevelTarget(): number {
  return QUESTIONS_PER_LEVEL;
}

export function getCelebratedStreaks(): number[] {
  return gameRules.celebratedStreaks;
}
