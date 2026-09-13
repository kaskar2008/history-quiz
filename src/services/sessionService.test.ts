import { beforeEach, describe, expect, it } from "vitest";
import type { PersistedSession } from "../game/types";
import { clearSession, loadSession, saveSession, SESSION_STORAGE_KEY } from "./sessionService";

function makeSession(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    version: 1,
    stage: "question",
    mode: "lives",
    filters: { scope: "world", countries: [], regions: [], periods: [], topics: [] },
    currentLevel: 3,
    levelQuestions: [],
    questionIndex: 5,
    selectedOptionId: null,
    isAnswerLocked: false,
    timedOut: false,
    questionDeadlineAt: Date.now() + 15000,
    score: 1200,
    correctAnswers: 5,
    wrongAnswers: 1,
    answeredQuestions: 6,
    currentStreak: 2,
    maxStreak: 4,
    mistakesInLevel: 1,
    totalMistakes: 1,
    levelOutcomes: [],
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("sessionService: сохранение и восстановление сессии в процессе игры", () => {
  it("возвращает null, если сессия не сохранялась", () => {
    expect(loadSession()).toBeNull();
  });

  it("сохранённая сессия читается обратно без потерь", () => {
    const session = makeSession();
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it("clearSession удаляет сохранённую сессию", () => {
    saveSession(makeSession());
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it("безопасно возвращает null при повреждённом JSON", () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, "{not valid json");
    expect(loadSession()).toBeNull();
  });

  it("безопасно возвращает null при неожиданной структуре данных", () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    expect(loadSession()).toBeNull();
  });

  it("безопасно возвращает null при недопустимом режиме игры", () => {
    const session = { ...makeSession(), mode: "invalid-mode" };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    expect(loadSession()).toBeNull();
  });

  it("безопасно возвращает null при несовпадающей версии", () => {
    const session = { ...makeSession(), version: 99 };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    expect(loadSession()).toBeNull();
  });
});
