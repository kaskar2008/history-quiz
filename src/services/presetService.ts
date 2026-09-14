import countriesData from "../data/dictionaries/countries.json";
import periodsData from "../data/dictionaries/periods.json";
import type { DictionaryEntry } from "../data/types";
import type { CustomPreset, CustomSettings, QuizFilters } from "../game/types";

const periods = periodsData as DictionaryEntry[];
const countries = countriesData as DictionaryEntry[];

/**
 * Named custom-mode configurations the player has chosen to keep, so a
 * favorite grouping/count/shuffle/time combination can be reapplied without
 * reconfiguring the custom setup screen from scratch. Separate from
 * StoredProgress: presets are configuration, not game history.
 */
export const PRESET_STORAGE_KEY = "history-quiz:custom-presets:v1";

/** Caps how many presets are kept; oldest are dropped first once exceeded. */
export const MAX_PRESETS = 20;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCustomPreset(value: unknown): value is CustomPreset {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "string" &&
    isPlainObject(value.filters) &&
    isPlainObject(value.customSettings)
  );
}

/** Safely reads saved presets. Never throws: any problem (missing key, invalid JSON, unexpected shape) yields an empty list. */
export function loadPresets(): CustomPreset[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isCustomPreset)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function savePresets(presets: CustomPreset[]): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Best-effort only: losing a preset save is not fatal.
  }
}

/** Adds a new preset and returns the updated list. Oldest presets are dropped once MAX_PRESETS is exceeded. */
export function addPreset(name: string, filters: QuizFilters, customSettings: CustomSettings): CustomPreset[] {
  const preset: CustomPreset = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString(),
    filters,
    customSettings,
  };
  const next = [...loadPresets(), preset].slice(-MAX_PRESETS);
  savePresets(next);
  return next;
}

/** Removes a preset by id and returns the updated list. */
export function deletePreset(id: string): CustomPreset[] {
  const next = loadPresets().filter((preset) => preset.id !== id);
  savePresets(next);
  return next;
}

/** Short human-readable summary of a preset's configuration, e.g. for a list row. */
export function describeCustomPreset(preset: CustomPreset): string {
  const groupingLabel =
    preset.filters.scope === "period"
      ? `Период: ${periods.find((p) => p.id === preset.filters.periods[0])?.label ?? "—"}`
      : preset.filters.scope === "country"
        ? `Страна: ${countries.find((c) => c.id === preset.filters.countries[0])?.label ?? "—"}`
        : "Все вопросы";
  const timeLabel =
    preset.customSettings.timeLimitSeconds === null ? "без ограничения" : `${preset.customSettings.timeLimitSeconds} сек`;
  return `${groupingLabel} • ${preset.customSettings.questionsPerLevel} вопр./уровень • ${timeLabel}`;
}
