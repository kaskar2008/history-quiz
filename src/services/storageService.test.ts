import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyProgress, type AttemptResult } from "../game/types";
import { addAchievements, applyAttemptToProgress, loadProgress, saveProgress, STORAGE_KEY } from "./storageService";

function makeAttempt(overrides: Partial<AttemptResult> = {}): AttemptResult {
  return {
    id: "attempt-1",
    completedAt: "2024-01-01T00:00:00.000Z",
    mode: "lives",
    scope: "world",
    countries: [],
    regions: [],
    periods: [],
    score: 1000,
    correctAnswers: 25,
    wrongAnswers: 5,
    answeredQuestions: 30,
    highestLevelReached: 3,
    maxStreak: 8,
    finishReason: "too-many-mistakes",
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("storageService: безопасное чтение localStorage", () => {
  it("возвращает пустой прогресс, если ключ отсутствует", () => {
    const progress = loadProgress();
    expect(progress).toEqual(createEmptyProgress());
  });

  it("возвращает пустой прогресс при повреждённом JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not valid json");
    const progress = loadProgress();
    expect(progress).toEqual(createEmptyProgress());
  });

  it("возвращает пустой прогресс при неожиданной структуре данных", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }));
    const progress = loadProgress();
    expect(progress).toEqual(createEmptyProgress());
  });

  it("возвращает пустой прогресс при несовпадающей версии", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyProgress(), version: 99 }));
    const progress = loadProgress();
    expect(progress).toEqual(createEmptyProgress());
  });

  it("успешно читает корректно сохранённый прогресс", () => {
    const progress = applyAttemptToProgress(createEmptyProgress(), makeAttempt(), [], "lives");
    saveProgress(progress);
    const loaded = loadProgress();
    expect(loaded.attempts).toHaveLength(1);
    expect(loaded.statistics.lives.bestScore).toBe(1000);
  });

  it("обрезает историю попыток до последних 100", () => {
    let progress = createEmptyProgress();
    for (let i = 0; i < 110; i += 1) {
      progress = applyAttemptToProgress(progress, makeAttempt({ id: `attempt-${i}` }), [], "lives");
    }
    saveProgress(progress);
    const loaded = loadProgress();
    expect(loaded.attempts).toHaveLength(100);
    expect(loaded.attempts[0].id).toBe("attempt-10");
  });
});

describe("storageService: раздельная статистика режимов", () => {
  it("не смешивает статистику режимов «Жизни» и «Бог»", () => {
    let progress = createEmptyProgress();
    progress = applyAttemptToProgress(progress, makeAttempt({ mode: "lives", score: 1000 }), [], "lives");
    progress = applyAttemptToProgress(progress, makeAttempt({ mode: "god", score: 5000 }), [], "god");

    expect(progress.statistics.lives.bestScore).toBe(1000);
    expect(progress.statistics.lives.totalAttempts).toBe(1);
    expect(progress.statistics.god.bestScore).toBe(5000);
    expect(progress.statistics.god.totalAttempts).toBe(1);
  });

  it("хранит лучший результат по уровню отдельно для каждого режима", () => {
    let progress = createEmptyProgress();
    progress = applyAttemptToProgress(
      progress,
      makeAttempt({ mode: "lives" }),
      [{ level: 1, correct: 30, wrong: 0, total: 30, score: 4000, maxStreak: 30, stars: 3 }],
      "lives",
    );
    progress = applyAttemptToProgress(
      progress,
      makeAttempt({ mode: "god" }),
      [{ level: 1, correct: 20, wrong: 10, total: 30, score: 2000, maxStreak: 5, stars: 1 }],
      "god",
    );

    expect(progress.bestLevelResults.lives["1"].stars).toBe(3);
    expect(progress.bestLevelResults.god["1"].stars).toBe(1);
  });
});

describe("storageService: достижения", () => {
  it("добавляет новые достижения без дублей", () => {
    let progress = createEmptyProgress();
    progress = addAchievements(progress, ["first-step"]);
    progress = addAchievements(progress, ["first-step", "flawless"]);
    expect(progress.achievements.sort()).toEqual(["first-step", "flawless"]);
  });
});
