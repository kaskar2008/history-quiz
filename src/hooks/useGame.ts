import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  filterQuestions,
  loadLevelQuestions,
  prefetchLevelQuestions,
  selectQuestionsForLevel,
} from "../services/questionLoader";
import {
  checkKeeperOfTimeAchievement,
  checkLevelAchievements,
  checkRunAchievements,
} from "../services/achievementService";
import { buildRecordKey, getRecord, isNewRecord, withUpdatedRecord } from "../services/recordService";
import {
  addAchievements,
  applyAttemptToProgress,
  loadProgress,
  saveProgress,
} from "../services/storageService";
import { clearSession, loadSession, saveSession } from "../services/sessionService";
import { createInitialGameState, gameReducer } from "../game/reducer";
import {
  fromPersistedSession,
  toPersistedSession,
  QUESTIONS_PER_LEVEL,
  TOTAL_LEVELS,
  type AttemptResult,
  type GameMode,
  type GameState,
  type QuizFilters,
  type StoredProgress,
} from "../game/types";

/** Resumes an in-progress attempt from localStorage, if one was left mid-quiz. */
function getInitialGameState(): GameState {
  const session = loadSession();
  return session ? fromPersistedSession(session) : createInitialGameState();
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialGameState);
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  // Initialized from the (possibly restored) starting state so a resumed
  // session with already-completed levels isn't treated as "newly finished"
  // on the very next render (harmless either way — the merge is idempotent
  // and achievement checks are filtered by what's already owned — but this
  // avoids a redundant localStorage write right after restoring).
  const processedLevelCount = useRef(state.levelOutcomes.length);
  const processedRun = useRef(false);
  const runAchievementsRef = useRef<string[]>([]);

  // Keep the resumable session snapshot in sync with the game state: saved
  // while an attempt is genuinely in progress, cleared once it isn't
  // (home/mode-selection screens, or a finished run whose stats are already
  // persisted above).
  useEffect(() => {
    const session = toPersistedSession(state);
    if (session) {
      saveSession(session);
    } else {
      clearSession();
    }
  }, [state]);

  // Load questions whenever we enter the "loading" stage.
  useEffect(() => {
    if (state.stage !== "loading") return;
    let cancelled = false;

    loadLevelQuestions(state.currentLevel)
      .then((pool) => {
        if (cancelled) return;
        const filtered = filterQuestions(pool, state.filters);
        const source = filtered.length > 0 ? filtered : pool;
        const selected = selectQuestionsForLevel(source, QUESTIONS_PER_LEVEL);
        dispatch({ type: "LEVEL_LOADED", questions: selected });
        if (state.currentLevel < TOTAL_LEVELS) {
          prefetchLevelQuestions(state.currentLevel + 1);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Не удалось загрузить вопросы уровня";
        dispatch({ type: "LEVEL_LOAD_FAILED", error: message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stage, state.currentLevel]);

  // Reset per-run guards whenever a new run starts.
  useEffect(() => {
    if (state.stage === "level-map" && state.levelOutcomes.length === 0) {
      processedLevelCount.current = 0;
      processedRun.current = false;
      runAchievementsRef.current = [];
    }
  }, [state.stage, state.levelOutcomes.length]);

  // Persist per-level results (best score/stars + level-scoped achievements) as soon as a level completes.
  useEffect(() => {
    if (state.stage !== "level-result" && state.stage !== "game-result") return;
    if (state.levelOutcomes.length === 0) return;
    if (processedLevelCount.current >= state.levelOutcomes.length) return;

    const latestOutcome = state.levelOutcomes[state.levelOutcomes.length - 1];
    processedLevelCount.current = state.levelOutcomes.length;

    if (!state.mode) return;

    setProgress((current) => {
      let next = current;
      const merged = applyAttemptToProgressLevelOnly(next, state.mode as GameMode, latestOutcome);
      next = merged;

      const levelAchievements = checkLevelAchievements(
        next,
        { level: latestOutcome.level, mistakesInLevel: latestOutcome.wrong, stars: latestOutcome.stars },
        latestOutcome.maxStreak,
      );
      const keeperAchievements = checkKeeperOfTimeAchievement(next, state.mode as GameMode, TOTAL_LEVELS);
      const allNew = [...levelAchievements, ...keeperAchievements];
      if (allNew.length > 0) {
        next = addAchievements(next, allNew);
        for (const id of allNew) {
          if (!runAchievementsRef.current.includes(id)) runAchievementsRef.current.push(id);
        }
        dispatch({ type: "SET_NEW_ACHIEVEMENTS", achievements: [...runAchievementsRef.current] });
      }
      saveProgress(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stage, state.levelOutcomes.length]);

  // Persist the finished attempt summary + run-scoped achievements + record check.
  useEffect(() => {
    if (state.stage !== "game-result") return;
    if (processedRun.current) return;
    processedRun.current = true;
    if (!state.mode || !state.finishReason) return;

    const attempt: AttemptResult = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      completedAt: new Date().toISOString(),
      mode: state.mode,
      scope: state.filters.scope,
      countries: state.filters.countries,
      regions: state.filters.regions,
      periods: state.filters.periods,
      score: state.score,
      correctAnswers: state.correctAnswers,
      wrongAnswers: state.wrongAnswers,
      answeredQuestions: state.answeredQuestions,
      highestLevelReached: state.currentLevel,
      maxStreak: state.maxStreak,
      finishReason: state.finishReason,
    };

    setProgress((current) => {
      let next = applyAttemptToProgress(current, attempt, [], state.mode as GameMode);

      const runAchievements = checkRunAchievements(next, {
        mode: state.mode as GameMode,
        finishReason: state.finishReason!,
        highestLevelReached: state.currentLevel,
        totalLevels: TOTAL_LEVELS,
      });
      if (runAchievements.length > 0) {
        next = addAchievements(next, runAchievements);
        for (const id of runAchievements) {
          if (!runAchievementsRef.current.includes(id)) runAchievementsRef.current.push(id);
        }
      }
      dispatch({ type: "SET_NEW_ACHIEVEMENTS", achievements: [...runAchievementsRef.current] });

      const key = buildRecordKey(state.mode as GameMode, state.filters);
      const previousRecord = getRecord(next, key);
      const beatRecord = isNewRecord(previousRecord, attempt.score);
      next = withUpdatedRecord(next, key, state.mode as GameMode, attempt.score, attempt.completedAt);
      dispatch({
        type: "SET_RECORD_INFO",
        isNewRecord: beatRecord,
        previousRecordScore: previousRecord?.score ?? null,
      });

      saveProgress(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stage]);

  // Leaving mid-attempt intentionally does NOT save an "abandoned" attempt:
  // only completed levels' best scores/stars/achievements (already persisted
  // incrementally above) survive. The confirmation dialog in the UI is what
  // warns the player about this before they leave.
  const goHome = useCallback(() => dispatch({ type: "GO_HOME" }), []);

  const goToModeSelection = useCallback(() => dispatch({ type: "GO_TO_MODE_SELECTION" }), []);

  const selectMode = useCallback((mode: GameMode, filters?: QuizFilters, startLevel?: number) => {
    dispatch({ type: "SELECT_MODE", mode, filters, startLevel });
  }, []);

  const startLevel = useCallback((level: number) => dispatch({ type: "START_LEVEL", level }), []);
  const selectAnswer = useCallback((optionId: string) => dispatch({ type: "SELECT_ANSWER", optionId }), []);
  const timeExpired = useCallback(() => dispatch({ type: "TIME_EXPIRED" }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);

  return {
    state,
    progress,
    goHome,
    goToModeSelection,
    selectMode,
    startLevel,
    selectAnswer,
    timeExpired,
    next,
  };
}

/** Merges a single level outcome (best score/stars only) without touching attempts/statistics. */
function applyAttemptToProgressLevelOnly(
  progress: StoredProgress,
  mode: GameMode,
  outcome: { level: number; score: number; stars: 0 | 1 | 2 | 3 },
): StoredProgress {
  const key = String(outcome.level);
  const existing = progress.bestLevelResults[mode][key];
  if (existing && existing.score >= outcome.score && existing.stars >= outcome.stars) {
    return progress;
  }
  return {
    ...progress,
    bestLevelResults: {
      ...progress.bestLevelResults,
      [mode]: {
        ...progress.bestLevelResults[mode],
        [key]: {
          score: Math.max(existing?.score ?? 0, outcome.score),
          stars: Math.max(existing?.stars ?? 0, outcome.stars) as 0 | 1 | 2 | 3,
        },
      },
    },
  };
}
