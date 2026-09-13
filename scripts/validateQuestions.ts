/**
 * Validates the entire question bank against the rules from the technical
 * specification (section 18). Run with `npm run validate:questions`.
 *
 * `runValidation()` is a pure(ish) function (only reads files, no process.exit)
 * so it can also be exercised from the test suite; the CLI entry point below
 * prints a report and sets the process exit code.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const QUESTIONS_DIR = join(ROOT, "src/data/questions");
const DICTIONARIES_DIR = join(ROOT, "src/data/dictionaries");

const MIN_QUESTIONS_PER_LEVEL = 30;
const MIN_UNIQUE_DIFFICULTIES_PER_LEVEL = 30;
const TOTAL_LEVELS = 10;
const MIN_YEAR = -4000;
const MAX_YEAR = new Date().getFullYear();

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  level: number;
  difficulty: number;
  question: string;
  details: string | null;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  countries: string[];
  region: string;
  period: string;
  topics: string[];
  yearFrom: number;
  yearTo: number;
}

export interface ValidationResult {
  errors: string[];
  totalQuestions: number;
  levelCounts: Map<number, number>;
  filesChecked: number;
}

function isRequiredString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function runValidation(): ValidationResult {
  const errors: string[] = [];
  let filesChecked = 0;
  let totalQuestions = 0;

  function readJson(path: string): unknown {
    const raw = readFileSync(path, "utf-8");
    try {
      return JSON.parse(raw);
    } catch (err) {
      errors.push(`[JSON] Некорректный JSON в файле ${path}: ${(err as Error).message}`);
      return null;
    }
  }

  function loadDictionaryIds(fileName: string): Set<string> {
    const path = join(DICTIONARIES_DIR, fileName);
    const data = readJson(path);
    if (!Array.isArray(data)) {
      errors.push(`[Словарь] Не удалось прочитать словарь ${fileName}`);
      return new Set();
    }
    return new Set(data.map((entry: { id: string }) => entry.id));
  }

  const validRegions = loadDictionaryIds("regions.json");
  const validPeriods = loadDictionaryIds("periods.json");
  const validTopics = loadDictionaryIds("topics.json");
  const validCountries = loadDictionaryIds("countries.json");

  function validateQuestion(q: Partial<Question>, level: number, filePath: string, seenIds: Map<string, string>) {
    const context = `${filePath} :: ${q.id ?? "(без id)"}`;

    if (!isRequiredString(q.id)) errors.push(`[Обязательное поле] ${context}: отсутствует id`);
    if (typeof q.level !== "number") errors.push(`[Обязательное поле] ${context}: отсутствует level`);
    if (typeof q.difficulty !== "number") errors.push(`[Обязательное поле] ${context}: отсутствует difficulty`);
    if (!isRequiredString(q.question)) errors.push(`[Обязательное поле] ${context}: отсутствует question`);
    if (!Array.isArray(q.options)) errors.push(`[Обязательное поле] ${context}: отсутствуют options`);
    if (!isRequiredString(q.correctOptionId)) {
      errors.push(`[Обязательное поле] ${context}: отсутствует correctOptionId`);
    }
    if (!isRequiredString(q.explanation)) errors.push(`[Обязательное поле] ${context}: отсутствует explanation`);
    if (!Array.isArray(q.countries) || q.countries.length === 0) {
      errors.push(`[Обязательное поле] ${context}: отсутствует хотя бы одна страна`);
    }
    if (!isRequiredString(q.region)) errors.push(`[Обязательное поле] ${context}: отсутствует region`);
    if (!isRequiredString(q.period)) errors.push(`[Обязательное поле] ${context}: отсутствует period`);
    if (!Array.isArray(q.topics) || q.topics.length === 0) {
      errors.push(`[Обязательное поле] ${context}: отсутствует хотя бы одна тема`);
    }
    if (typeof q.yearFrom !== "number") errors.push(`[Обязательное поле] ${context}: отсутствует yearFrom`);
    if (typeof q.yearTo !== "number") errors.push(`[Обязательное поле] ${context}: отсутствует yearTo`);

    if (typeof q.level === "number" && q.level !== level) {
      errors.push(`[Уровень] ${context}: level=${q.level}, но находится в файле уровня ${level}`);
    }

    if (isRequiredString(q.id)) {
      const existing = seenIds.get(q.id);
      if (existing) {
        errors.push(`[Дубликат id] "${q.id}" встречается и в ${existing}, и в ${context}`);
      } else {
        seenIds.set(q.id, context);
      }
    }

    if (Array.isArray(q.options)) {
      if (q.options.length !== 4) {
        errors.push(`[Варианты] ${context}: должно быть ровно 4 варианта, найдено ${q.options.length}`);
      }
      const optionIds = q.options.map((o) => o?.id);
      const optionTexts = q.options.map((o) => o?.text?.trim());
      if (new Set(optionIds).size !== optionIds.length) {
        errors.push(`[Варианты] ${context}: id вариантов повторяются`);
      }
      if (new Set(optionTexts).size !== optionTexts.length) {
        errors.push(`[Варианты] ${context}: тексты вариантов повторяются`);
      }
      for (const opt of q.options) {
        if (!opt || !isRequiredString(opt.id) || !isRequiredString(opt.text)) {
          errors.push(`[Варианты] ${context}: у варианта отсутствует id или text`);
        }
      }

      if (isRequiredString(q.correctOptionId) && !optionIds.includes(q.correctOptionId)) {
        errors.push(`[Правильный ответ] ${context}: correctOptionId "${q.correctOptionId}" не найден среди options`);
      }
    }

    if (isRequiredString(q.region) && !validRegions.has(q.region)) {
      errors.push(`[Категория] ${context}: недопустимый region "${q.region}"`);
    }
    if (isRequiredString(q.period) && !validPeriods.has(q.period)) {
      errors.push(`[Категория] ${context}: недопустимый period "${q.period}"`);
    }
    if (Array.isArray(q.topics)) {
      for (const topic of q.topics) {
        if (!validTopics.has(topic)) errors.push(`[Категория] ${context}: недопустимая тема "${topic}"`);
      }
    }
    if (Array.isArray(q.countries)) {
      for (const country of q.countries) {
        if (!validCountries.has(country)) errors.push(`[Категория] ${context}: недопустимая страна "${country}"`);
      }
    }

    if (typeof q.yearFrom === "number" && typeof q.yearTo === "number") {
      if (q.yearFrom > q.yearTo) {
        errors.push(`[Годы] ${context}: yearFrom (${q.yearFrom}) больше yearTo (${q.yearTo})`);
      }
      if (q.yearFrom < MIN_YEAR || q.yearTo > MAX_YEAR) {
        errors.push(`[Годы] ${context}: диапазон лет вне допустимых границ (${MIN_YEAR}..${MAX_YEAR})`);
      }
    }

    if (q.details !== null && typeof q.details !== "string") {
      errors.push(`[details] ${context}: details должен быть строкой или null, получено ${typeof q.details}`);
    }

    if (isRequiredString(q.question) && q.question.length > 220) {
      errors.push(`[Длина] ${context}: текст вопроса слишком длинный (${q.question.length} символов)`);
    }
  }

  const seenIds = new Map<string, string>();
  const seenQuestionTexts = new Map<string, string>();
  const levelCounts = new Map<number, number>();

  const files = readdirSync(QUESTIONS_DIR).filter((f) => /^level-\d{2}\.json$/.test(f));

  for (let level = 1; level <= TOTAL_LEVELS; level += 1) {
    const padded = String(level).padStart(2, "0");
    const fileName = `level-${padded}.json`;
    if (!files.includes(fileName)) {
      errors.push(`[Файл] Отсутствует файл ${fileName} для уровня ${level}`);
      continue;
    }

    const filePath = join(QUESTIONS_DIR, fileName);
    const data = readJson(filePath);
    filesChecked += 1;

    if (!Array.isArray(data)) {
      errors.push(`[Файл] ${fileName}: содержимое должно быть массивом вопросов`);
      continue;
    }

    levelCounts.set(level, data.length);
    totalQuestions += data.length;

    const difficultiesInLevel = new Set<number>();

    for (const q of data as Partial<Question>[]) {
      validateQuestion(q, level, fileName, seenIds);

      if (typeof q.difficulty === "number") {
        difficultiesInLevel.add(q.difficulty);
      }

      if (isRequiredString(q.question)) {
        const normalized = q.question.trim().toLowerCase();
        const existing = seenQuestionTexts.get(normalized);
        if (existing) {
          errors.push(`[Дубликат вопроса] "${q.question}" повторяется в ${existing} и ${fileName}`);
        } else {
          seenQuestionTexts.set(normalized, fileName);
        }
      }
    }

    if (data.length < MIN_QUESTIONS_PER_LEVEL) {
      errors.push(
        `[Минимум вопросов] ${fileName}: найдено ${data.length}, требуется минимум ${MIN_QUESTIONS_PER_LEVEL}`,
      );
    }

    // Need enough distinct difficulty values so a random 30-question draw
    // sorts into a meaningful easy-to-hard progression rather than long
    // runs of tied difficulty.
    const requiredUnique = Math.min(MIN_UNIQUE_DIFFICULTIES_PER_LEVEL, data.length);
    if (difficultiesInLevel.size < requiredUnique) {
      errors.push(
        `[Сложность] ${fileName}: найдено ${difficultiesInLevel.size} уникальных значений difficulty, требуется минимум ${requiredUnique}`,
      );
    }
  }

  const indexPath = join(QUESTIONS_DIR, "index.json");
  const index = readJson(indexPath) as { levels?: { level: number; file: string; questionCount: number }[] } | null;
  if (index && Array.isArray(index.levels)) {
    for (const entry of index.levels) {
      const actualCount = levelCounts.get(entry.level);
      if (actualCount !== undefined && actualCount !== entry.questionCount) {
        errors.push(
          `[index.json] Уровень ${entry.level}: questionCount=${entry.questionCount}, но фактически вопросов ${actualCount}`,
        );
      }
    }
  } else {
    errors.push(`[index.json] Не удалось прочитать корректную структуру index.json`);
  }

  return { errors, totalQuestions, levelCounts, filesChecked };
}

function main() {
  const { errors, totalQuestions, levelCounts, filesChecked } = runValidation();

  console.log(`Проверено файлов уровней: ${filesChecked}`);
  console.log(`Всего вопросов: ${totalQuestions}`);
  for (const [level, count] of [...levelCounts.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  Уровень ${level}: ${count} вопрос(ов)`);
  }

  if (errors.length > 0) {
    console.error(`\nНайдено проблем: ${errors.length}\n`);
    for (const e of errors) console.error(" - " + e);
    process.exitCode = 1;
  } else {
    console.log("\nВалидация пройдена успешно: ошибок не найдено.");
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main();
}
