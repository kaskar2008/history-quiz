import { beforeEach, describe, expect, it } from "vitest";
import { defaultCustomSettings, defaultFilters } from "../game/types";
import { addPreset, deletePreset, loadPresets, MAX_PRESETS, PRESET_STORAGE_KEY } from "./presetService";

beforeEach(() => {
  window.localStorage.clear();
});

describe("presetService: сохранение и загрузка пресетов кастомного режима", () => {
  it("возвращает пустой список, если пресеты не сохранялись", () => {
    expect(loadPresets()).toEqual([]);
  });

  it("сохранённый пресет читается обратно с теми же фильтрами и настройками", () => {
    const filters = { ...defaultFilters, scope: "period" as const, periods: ["ancient" as const] };
    const settings = { ...defaultCustomSettings, questionsPerLevel: 15, timeLimitSeconds: null };

    const presets = addPreset("Древний мир", filters, settings);

    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe("Древний мир");
    expect(presets[0].filters).toEqual(filters);
    expect(presets[0].customSettings).toEqual(settings);
    expect(loadPresets()).toEqual(presets);
  });

  it("добавляет несколько пресетов без потери предыдущих", () => {
    addPreset("Первый", defaultFilters, defaultCustomSettings);
    const presets = addPreset("Второй", defaultFilters, defaultCustomSettings);
    expect(presets.map((p) => p.name)).toEqual(["Первый", "Второй"]);
  });

  it("deletePreset удаляет только указанный пресет", () => {
    addPreset("Оставить", defaultFilters, defaultCustomSettings);
    const [, toRemove] = addPreset("Удалить", defaultFilters, defaultCustomSettings);
    const remaining = deletePreset(toRemove.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe("Оставить");
  });

  it("ограничивает число хранимых пресетов, отбрасывая самые старые", () => {
    let presets = loadPresets();
    for (let i = 0; i < MAX_PRESETS + 5; i += 1) {
      presets = addPreset(`Пресет ${i}`, defaultFilters, defaultCustomSettings);
    }
    expect(presets).toHaveLength(MAX_PRESETS);
    expect(presets[0].name).toBe("Пресет 5");
    expect(presets[presets.length - 1].name).toBe(`Пресет ${MAX_PRESETS + 4}`);
  });

  it("безопасно возвращает пустой список при повреждённом JSON", () => {
    window.localStorage.setItem(PRESET_STORAGE_KEY, "{not valid json");
    expect(loadPresets()).toEqual([]);
  });

  it("безопасно возвращает пустой список при неожиданной структуре данных", () => {
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify([{ foo: "bar" }]));
    expect(loadPresets()).toEqual([]);
  });
});
