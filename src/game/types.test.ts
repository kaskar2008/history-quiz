import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./reducer";
import { defaultFilters, fromPersistedSession, toPersistedSession } from "./types";

describe("toPersistedSession: что сохраняем при активной попытке", () => {
  it("возвращает null на главном экране (нет активной попытки)", () => {
    expect(toPersistedSession(createInitialGameState())).toBeNull();
  });

  it("возвращает null на экране выбора режима", () => {
    const state = { ...createInitialGameState(), stage: "mode-selection" as const };
    expect(toPersistedSession(state)).toBeNull();
  });

  it("возвращает null после завершения прохождения (game-result)", () => {
    const state = {
      ...createInitialGameState(),
      stage: "game-result" as const,
      mode: "lives" as const,
      finishReason: "completed" as const,
    };
    expect(toPersistedSession(state)).toBeNull();
  });

  it("возвращает снимок сессии во время вопроса", () => {
    const state = {
      ...createInitialGameState(),
      stage: "question" as const,
      mode: "god" as const,
      currentLevel: 4,
      questionIndex: 7,
      score: 900,
      questionDeadlineAt: 123456,
    };
    const session = toPersistedSession(state);
    expect(session).not.toBeNull();
    expect(session?.mode).toBe("god");
    expect(session?.currentLevel).toBe(4);
    expect(session?.questionIndex).toBe(7);
    expect(session?.score).toBe(900);
    expect(session?.questionDeadlineAt).toBe(123456);
  });
});

describe("fromPersistedSession: восстановление состояния после перезагрузки", () => {
  it("восстанавливает уровень, прогресс и дедлайн таймера один в один", () => {
    const session = {
      version: 1 as const,
      stage: "question" as const,
      mode: "lives" as const,
      filters: defaultFilters,
      currentLevel: 6,
      levelQuestions: [],
      questionIndex: 12,
      selectedOptionId: null,
      isAnswerLocked: false,
      timedOut: false,
      questionDeadlineAt: 987654321,
      score: 4200,
      correctAnswers: 20,
      wrongAnswers: 3,
      answeredQuestions: 23,
      currentStreak: 5,
      maxStreak: 9,
      mistakesInLevel: 2,
      totalMistakes: 3,
      levelOutcomes: [],
    };

    const restored = fromPersistedSession(session);

    expect(restored.stage).toBe("question");
    expect(restored.mode).toBe("lives");
    expect(restored.currentLevel).toBe(6);
    expect(restored.questionIndex).toBe(12);
    expect(restored.questionDeadlineAt).toBe(987654321);
    expect(restored.score).toBe(4200);
    expect(restored.totalMistakes).toBe(3);
    // Transient/display-only fields reset to defaults on restore.
    expect(restored.newAchievements).toEqual([]);
    expect(restored.isNewRecord).toBe(false);
    expect(restored.error).toBeNull();
  });

  it("отправляет ту же попытку туда и обратно (toPersistedSession -> fromPersistedSession)", () => {
    const original = {
      ...createInitialGameState(),
      stage: "answer-result" as const,
      mode: "god" as const,
      currentLevel: 2,
      questionIndex: 3,
      score: 555,
      totalMistakes: 4,
    };

    const session = toPersistedSession(original);
    expect(session).not.toBeNull();
    const restored = fromPersistedSession(session!);

    expect(restored.stage).toBe(original.stage);
    expect(restored.mode).toBe(original.mode);
    expect(restored.currentLevel).toBe(original.currentLevel);
    expect(restored.questionIndex).toBe(original.questionIndex);
    expect(restored.score).toBe(original.score);
    expect(restored.totalMistakes).toBe(original.totalMistakes);
  });
});
