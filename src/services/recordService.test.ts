import { describe, expect, it } from "vitest";
import { defaultFilters } from "../game/types";
import { buildRecordKey, isNewRecord } from "./recordService";

describe("recordService: формирование ключа фильтров", () => {
  it("строит одинаковый ключ независимо от порядка массивов", () => {
    const filtersA = { ...defaultFilters, countries: ["egypt", "china"], regions: ["africa" as const, "asia" as const] };
    const filtersB = { ...defaultFilters, countries: ["china", "egypt"], regions: ["asia" as const, "africa" as const] };

    expect(buildRecordKey("lives", filtersA)).toBe(buildRecordKey("lives", filtersB));
  });

  it("разные режимы дают разные ключи при одинаковых фильтрах", () => {
    const key1 = buildRecordKey("lives", defaultFilters);
    const key2 = buildRecordKey("god", defaultFilters);
    expect(key1).not.toBe(key2);
  });

  it("разные фильтры дают разные ключи", () => {
    const key1 = buildRecordKey("lives", defaultFilters);
    const key2 = buildRecordKey("lives", { ...defaultFilters, countries: ["egypt"] });
    expect(key1).not.toBe(key2);
  });
});

describe("recordService: определение нового рекорда", () => {
  it("первая попытка всегда устанавливает рекорд", () => {
    expect(isNewRecord(null, 100)).toBe(true);
    expect(isNewRecord(null, 0)).toBe(true);
  });

  it("более высокий счёт считается новым рекордом", () => {
    const previous = { key: "k", score: 500, mode: "lives" as const, achievedAt: "2024-01-01" };
    expect(isNewRecord(previous, 600)).toBe(true);
  });

  it("равный счёт не считается новым рекордом", () => {
    const previous = { key: "k", score: 500, mode: "lives" as const, achievedAt: "2024-01-01" };
    expect(isNewRecord(previous, 500)).toBe(false);
  });

  it("более низкий счёт не считается новым рекордом", () => {
    const previous = { key: "k", score: 500, mode: "lives" as const, achievedAt: "2024-01-01" };
    expect(isNewRecord(previous, 400)).toBe(false);
  });
});
