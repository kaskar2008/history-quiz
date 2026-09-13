import { describe, expect, it } from "vitest";
import {
  getAnswerPoints,
  getLevelCompletionBonus,
  getRankForScore,
  getStarsForLevel,
  getStreakBonusPerAnswer,
} from "./scoringService";

describe("scoringService: очки и бонусы", () => {
  it("начисляет 0 очков за неверный ответ независимо от серии", () => {
    expect(getAnswerPoints(false, 0)).toBe(0);
    expect(getAnswerPoints(false, 5)).toBe(0);
  });

  it("начисляет 100 очков за верный ответ без бонуса серии (1-2 подряд)", () => {
    expect(getAnswerPoints(true, 1)).toBe(100);
    expect(getAnswerPoints(true, 2)).toBe(100);
  });

  it("добавляет +10 к ответу при серии 3-4", () => {
    expect(getAnswerPoints(true, 3)).toBe(110);
    expect(getAnswerPoints(true, 4)).toBe(110);
  });

  it("добавляет +20 к ответу при серии 5-9", () => {
    expect(getAnswerPoints(true, 5)).toBe(120);
    expect(getAnswerPoints(true, 9)).toBe(120);
  });

  it("добавляет +30 к ответу при серии 10 и более", () => {
    expect(getAnswerPoints(true, 10)).toBe(130);
    expect(getAnswerPoints(true, 25)).toBe(130);
  });

  it("getStreakBonusPerAnswer возвращает верный бонус по границам серии", () => {
    expect(getStreakBonusPerAnswer(1)).toBe(0);
    expect(getStreakBonusPerAnswer(2)).toBe(0);
    expect(getStreakBonusPerAnswer(3)).toBe(10);
    expect(getStreakBonusPerAnswer(4)).toBe(10);
    expect(getStreakBonusPerAnswer(5)).toBe(20);
    expect(getStreakBonusPerAnswer(9)).toBe(20);
    expect(getStreakBonusPerAnswer(10)).toBe(30);
  });

  it("бонус за завершение уровня с ошибками равен 300", () => {
    expect(getLevelCompletionBonus(1)).toBe(300);
    expect(getLevelCompletionBonus(5)).toBe(300);
  });

  it("бонус за уровень без ошибок равен 300 + 500 = 800", () => {
    expect(getLevelCompletionBonus(0)).toBe(800);
  });
});

describe("scoringService: звёзды за уровень", () => {
  it("не даёт звёзд, если уровень не завершён", () => {
    expect(getStarsForLevel(30, 30, false)).toBe(0);
  });

  it("даёт 1 звезду при завершении с низкой точностью", () => {
    expect(getStarsForLevel(20, 30, true)).toBe(1); // ~66%
  });

  it("даёт 2 звезды при точности от 80%", () => {
    expect(getStarsForLevel(24, 30, true)).toBe(2); // 80%
    expect(getStarsForLevel(28, 30, true)).toBe(2); // ~93%, ниже 95%
  });

  it("даёт 3 звезды при точности от 95%", () => {
    expect(getStarsForLevel(29, 30, true)).toBe(3); // ~96.7%
    expect(getStarsForLevel(30, 30, true)).toBe(3); // 100%
  });
});

describe("scoringService: звания", () => {
  it("возвращает «Новичок» для нулевого счёта", () => {
    expect(getRankForScore(0).id).toBe("novice");
  });

  it("возвращает более высокое звание при достаточном счёте", () => {
    expect(getRankForScore(2000).id).toBe("history-lover");
    expect(getRankForScore(40000).id).toBe("keeper-of-time");
  });

  it("не понижает звание между порогами", () => {
    expect(getRankForScore(2500).id).toBe("history-lover");
  });
});
