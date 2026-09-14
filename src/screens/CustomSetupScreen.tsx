import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PageContainer } from "../components/PageContainer";
import { SavePresetDialog } from "../components/SavePresetDialog";
import countriesData from "../data/dictionaries/countries.json";
import periodsData from "../data/dictionaries/periods.json";
import type { DictionaryEntry, Period, Question } from "../data/types";
import {
  defaultCustomSettings,
  TOTAL_LEVELS,
  type CustomPreset,
  type CustomSettings,
  type QuizFilters,
  type QuizScope,
} from "../game/types";
import { filterQuestions, getMaxQuestionsPerLevel, loadAllQuestions } from "../services/questionLoader";
import { addPreset, deletePreset, describeCustomPreset, loadPresets } from "../services/presetService";
import styles from "./CustomSetupScreen.module.css";

const periods = periodsData as DictionaryEntry[];
const countries = countriesData as DictionaryEntry[];

type Grouping = Extract<QuizScope, "world" | "period" | "country">;

const TIME_OPTIONS: { label: string; value: number | null }[] = [
  { label: "10 сек", value: 10 },
  { label: "20 сек", value: 20 },
  { label: "30 сек", value: 30 },
  { label: "60 сек", value: 60 },
  { label: "Без ограничения", value: null },
];

interface CustomSetupScreenProps {
  onBack: () => void;
  onStart: (filters: QuizFilters, settings: CustomSettings) => void;
}

export function CustomSetupScreen({ onBack, onStart }: CustomSetupScreenProps) {
  const [allQuestions, setAllQuestions] = useState<Question[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [grouping, setGrouping] = useState<Grouping>("world");
  const [period, setPeriod] = useState<Period>((periods[0]?.id ?? "ancient") as Period);
  const [country, setCountry] = useState<string>(countries[0]?.id ?? "");

  const [questionsPerLevel, setQuestionsPerLevel] = useState(defaultCustomSettings.questionsPerLevel);
  const [shuffleQuestions, setShuffleQuestions] = useState(defaultCustomSettings.shuffleQuestions);
  const [shuffleOptions, setShuffleOptions] = useState(defaultCustomSettings.shuffleOptions);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(defaultCustomSettings.timeLimitSeconds);

  const [presets, setPresets] = useState<CustomPreset[]>(() => loadPresets());
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [presetPendingDelete, setPresetPendingDelete] = useState<CustomPreset | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAllQuestions()
      .then((questions) => {
        if (!cancelled) setAllQuestions(questions);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const levelCount = grouping === "world" ? TOTAL_LEVELS : 1;

  const filters: QuizFilters = useMemo(
    () => ({
      scope: grouping,
      countries: grouping === "country" ? [country] : [],
      regions: [],
      periods: grouping === "period" ? [period] : [],
      topics: [],
    }),
    [grouping, country, period],
  );

  const filteredCount = useMemo(() => {
    if (!allQuestions) return 0;
    return filterQuestions(allQuestions, filters).length;
  }, [allQuestions, filters]);

  const maxQuestionsPerLevel = allQuestions ? getMaxQuestionsPerLevel(filteredCount, levelCount) : questionsPerLevel;

  // Clamp the chosen count down whenever the available pool shrinks below it
  // (e.g. switching to a narrower period/country selection, or loading a
  // preset saved against a bigger pool).
  useEffect(() => {
    if (allQuestions && questionsPerLevel > maxQuestionsPerLevel) {
      setQuestionsPerLevel(maxQuestionsPerLevel);
    }
  }, [allQuestions, maxQuestionsPerLevel, questionsPerLevel]);

  const isReady = allQuestions !== null;
  const canStart = isReady && filteredCount > 0 && questionsPerLevel > 0;

  function handleStart() {
    onStart(filters, {
      questionsPerLevel,
      shuffleQuestions,
      shuffleOptions,
      timeLimitSeconds,
    });
  }

  function handleApplyPreset(preset: CustomPreset) {
    const scope = preset.filters.scope;
    if (scope === "world" || scope === "period" || scope === "country") {
      setGrouping(scope);
    }
    if (preset.filters.periods[0]) setPeriod(preset.filters.periods[0]);
    if (preset.filters.countries[0]) setCountry(preset.filters.countries[0]);
    setQuestionsPerLevel(preset.customSettings.questionsPerLevel);
    setShuffleQuestions(preset.customSettings.shuffleQuestions);
    setShuffleOptions(preset.customSettings.shuffleOptions);
    setTimeLimitSeconds(preset.customSettings.timeLimitSeconds);
  }

  function handleConfirmDeletePreset() {
    if (!presetPendingDelete) return;
    setPresets(deletePreset(presetPendingDelete.id));
    setPresetPendingDelete(null);
  }

  function handleSavePreset(name: string) {
    setPresets(addPreset(name, filters, { questionsPerLevel, shuffleQuestions, shuffleOptions, timeLimitSeconds }));
    setIsSaveDialogOpen(false);
  }

  return (
    <div className={styles.screen}>
      <PageContainer>
        <button type="button" className={styles.backLink} onClick={onBack}>
          ← Назад
        </button>
        <h1 className={styles.title}>Кастомный режим</h1>
        <p className={styles.subtitle}>Настройте квиз под себя и начните игру.</p>

        {presets.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Сохранённые пресеты</h2>
            <ul className={styles.presetList}>
              {presets.map((preset) => (
                <li key={preset.id} className={styles.presetItem}>
                  <div className={styles.presetInfo}>
                    <span className={styles.presetName}>{preset.name}</span>
                    <span className={styles.presetMeta}>{describeCustomPreset(preset)}</span>
                  </div>
                  <div className={styles.presetActions}>
                    <Button variant="secondary" onClick={() => handleApplyPreset(preset)}>
                      Загрузить
                    </Button>
                    <button
                      type="button"
                      className={styles.presetDelete}
                      aria-label={`Удалить пресет «${preset.name}»`}
                      onClick={() => setPresetPendingDelete(preset)}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Группировка вопросов</h2>
          <div className={styles.optionsColumn}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="grouping"
                checked={grouping === "world"}
                onChange={() => setGrouping("world")}
              />
              Все вопросы ({TOTAL_LEVELS} уровней)
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="grouping"
                checked={grouping === "period"}
                onChange={() => setGrouping("period")}
              />
              Только по периоду (1 уровень)
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="grouping"
                checked={grouping === "country"}
                onChange={() => setGrouping("country")}
              />
              Только по стране (1 уровень)
            </label>
          </div>
        </section>

        {grouping === "period" && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Период</h2>
            <select
              className={styles.select}
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </section>
        )}

        {grouping === "country" && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Страна</h2>
            <select className={styles.select} value={country} onChange={(e) => setCountry(e.target.value)}>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Вопросов на уровень</h2>
          {isReady ? (
            filteredCount > 0 ? (
              <>
                <input
                  type="range"
                  className={styles.slider}
                  min={1}
                  max={Math.max(1, maxQuestionsPerLevel)}
                  value={questionsPerLevel}
                  onChange={(e) => setQuestionsPerLevel(Number(e.target.value))}
                />
                <p className={styles.hint}>
                  {questionsPerLevel} из {maxQuestionsPerLevel} доступных (всего найдено вопросов: {filteredCount})
                </p>
              </>
            ) : (
              <p className={styles.hint}>По этому фильтру не нашлось вопросов. Выберите другой период или страну.</p>
            )
          ) : (
            <p className={styles.hint}>{loadFailed ? "Не удалось загрузить вопросы" : "Загрузка вопросов…"}</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Порядок и варианты</h2>
          <div className={styles.optionsColumn}>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
              />
              Перемешивать порядок вопросов
            </label>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
              />
              Перемешивать варианты ответа
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Время на ответ</h2>
          <div className={styles.optionsColumn}>
            {TIME_OPTIONS.map((opt) => (
              <label key={opt.label} className={styles.radioOption}>
                <input
                  type="radio"
                  name="timeLimit"
                  checked={timeLimitSeconds === opt.value}
                  onChange={() => setTimeLimitSeconds(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>
      </PageContainer>

      <div className={styles.bottomBar}>
        <div className={styles.bottomBarActions}>
          <Button variant="secondary" fullWidth onClick={() => setIsSaveDialogOpen(true)}>
            Сохранить как пресет
          </Button>
          <Button variant="primary" fullWidth onClick={handleStart} disabled={!canStart}>
            Начать
          </Button>
        </div>
      </div>

      <SavePresetDialog
        isOpen={isSaveDialogOpen}
        onCancel={() => setIsSaveDialogOpen(false)}
        onSave={handleSavePreset}
      />

      <ConfirmDialog
        isOpen={presetPendingDelete !== null}
        title="Удалить пресет?"
        message={`Пресет «${presetPendingDelete?.name ?? ""}» будет удалён без возможности восстановления.`}
        confirmLabel="Удалить"
        onCancel={() => setPresetPendingDelete(null)}
        onConfirm={handleConfirmDeletePreset}
      />
    </div>
  );
}
