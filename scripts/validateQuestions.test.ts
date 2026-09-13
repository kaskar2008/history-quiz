import { describe, expect, it } from "vitest";
import { runValidation } from "./validateQuestions.ts";

describe("validateQuestions: валидация базы вопросов", () => {
  it("не находит ошибок в текущей базе вопросов", () => {
    const result = runValidation();
    if (result.errors.length > 0) {
      // eslint-disable-next-line no-console
      console.error(result.errors.join("\n"));
    }
    expect(result.errors).toEqual([]);
  });

  it("каждый уровень содержит минимум 30 вопросов", () => {
    const result = runValidation();
    for (const [, count] of result.levelCounts) {
      expect(count).toBeGreaterThanOrEqual(30);
    }
  });

  it("проверяет ровно 10 файлов уровней", () => {
    const result = runValidation();
    expect(result.filesChecked).toBe(10);
    expect(result.levelCounts.size).toBe(10);
  });

  it("суммарно в базе минимум 300 вопросов", () => {
    const result = runValidation();
    expect(result.totalQuestions).toBeGreaterThanOrEqual(300);
  });
});
