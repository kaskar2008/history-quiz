import { describe, expect, it } from "vitest";
import type { Question } from "../data/types";
import { selectQuestionsForLevel, shuffle } from "./questionLoader";

function makeQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i}`,
    level: 1,
    difficulty: (i + 1) * 10,
    question: `Question ${i}`,
    details: null,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ],
    correctOptionId: "a",
    explanation: "Explanation",
    countries: ["egypt"],
    region: "africa",
    period: "ancient",
    topics: ["politics"],
    yearFrom: 0,
    yearTo: 0,
  }));
}

// Deterministic "random" sequence for reproducible tests.
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

describe("questionLoader: выбор 30 уникальных вопросов", () => {
  it("выбирает ровно 30 вопросов из пула большего размера", () => {
    const pool = makeQuestions(45);
    const selected = selectQuestionsForLevel(pool, 30, seededRandom(1));
    expect(selected).toHaveLength(30);
  });

  it("не содержит повторяющихся id среди выбранных вопросов", () => {
    const pool = makeQuestions(45);
    const selected = selectQuestionsForLevel(pool, 30, seededRandom(42));
    const ids = new Set(selected.map((q) => q.id));
    expect(ids.size).toBe(selected.length);
  });

  it("возвращает весь (перемешанный) пул, если вопросов меньше запрошенного", () => {
    const pool = makeQuestions(20);
    const selected = selectQuestionsForLevel(pool, 30, seededRandom(7));
    expect(selected).toHaveLength(20);
  });

  it("дедуплицирует вопросы с одинаковым id перед выбором", () => {
    const pool = [...makeQuestions(5), ...makeQuestions(5)]; // duplicated ids q-0..q-4 twice
    const selected = selectQuestionsForLevel(pool, 30, seededRandom(3));
    const ids = new Set(selected.map((q) => q.id));
    expect(selected.length).toBe(ids.size);
    expect(selected.length).toBe(5);
  });

  it("shuffle с одинаковым random-источником даёт детерминированный результат", () => {
    const items = [1, 2, 3, 4, 5];
    const resultA = shuffle(items, seededRandom(123));
    const resultB = shuffle(items, seededRandom(123));
    expect(resultA).toEqual(resultB);
  });
});

describe("questionLoader: сортировка выбранных вопросов по сложности", () => {
  it("возвращает вопросы отсортированными по возрастанию difficulty, даже если выбор случаен", () => {
    const pool = makeQuestions(45);
    const selected = selectQuestionsForLevel(pool, 30, seededRandom(99));
    const difficulties = selected.map((q) => q.difficulty);
    const sortedCopy = [...difficulties].sort((a, b) => a - b);
    expect(difficulties).toEqual(sortedCopy);
  });

  it("несколько вопросов с одинаковой сложностью не ломают сортировку", () => {
    const pool = makeQuestions(10).map((q, i) => ({ ...q, difficulty: i < 5 ? 10 : 20 }));
    const selected = selectQuestionsForLevel(pool, 10, seededRandom(5));
    const difficulties = selected.map((q) => q.difficulty);
    expect(difficulties.slice(0, 5).every((d) => d === 10)).toBe(true);
    expect(difficulties.slice(5).every((d) => d === 20)).toBe(true);
  });
});
