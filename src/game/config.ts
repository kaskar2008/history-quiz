import { MAX_LIVES_MISTAKES, QUESTIONS_PER_LEVEL } from "./types";

/** All numeric game-balance values live here so they can be tuned or tested in isolation. */
export const scoringConfig = {
  correctAnswerPoints: 100,
  wrongAnswerPoints: 0,
  levelCompletionBonus: 300,
  perfectLevelBonus: 500,
  /** Streak length thresholds -> bonus points added per correct answer while active. */
  streakBonusTiers: [
    { minStreak: 1, bonusPerAnswer: 0 },
    { minStreak: 3, bonusPerAnswer: 10 },
    { minStreak: 5, bonusPerAnswer: 20 },
    { minStreak: 10, bonusPerAnswer: 30 },
  ],
} as const;

export const starThresholds = {
  /** 1 star: level completed at all. */
  oneStarMinAccuracy: 0,
  /** 2 stars: at least this fraction correct. */
  twoStarMinAccuracy: 0.8,
  /** 3 stars: at least this fraction correct. */
  threeStarMinAccuracy: 0.95,
} as const;

export const gameRules = {
  maxLivesMistakes: MAX_LIVES_MISTAKES,
  questionsPerLevel: QUESTIONS_PER_LEVEL,
  /** Streak lengths that trigger a short celebratory animation/toast. */
  celebratedStreaks: [3, 5, 10, 15, 20, 25, 30] as number[],
} as const;

export interface RankDefinition {
  id: string;
  title: string;
  /** Minimum total score across the player's history to reach this rank. */
  minScore: number;
}

/** Ranks are ordered from lowest to highest; the highest matching entry applies. */
export const ranks: RankDefinition[] = [
  { id: "novice", title: "Новичок", minScore: 0 },
  { id: "history-lover", title: "Любитель истории", minScore: 2000 },
  { id: "researcher", title: "Исследователь", minScore: 5000 },
  { id: "chronicler", title: "Летописец", minScore: 10000 },
  { id: "historian", title: "Историк", minScore: 18000 },
  { id: "archivist", title: "Архивариус", minScore: 28000 },
  { id: "keeper-of-time", title: "Хранитель времени", minScore: 40000 },
];

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
}

export const achievements: AchievementDefinition[] = [
  {
    id: "first-step",
    title: "Первый шаг",
    description: "Завершите первый уровень",
  },
  {
    id: "flawless",
    title: "Безошибочно",
    description: "Пройдите уровень без единой ошибки",
  },
  {
    id: "streak-10",
    title: "Серия 10",
    description: "Дайте 10 правильных ответов подряд",
  },
  {
    id: "halfway",
    title: "Половина пути",
    description: "Завершите пятый уровень",
  },
  {
    id: "history-connoisseur",
    title: "Знаток истории",
    description: "Завершите все десять уровней",
  },
  {
    id: "unstoppable",
    title: "Неудержимый",
    description: "Завершите режим «Жизни»",
  },
  {
    id: "keeper-of-time",
    title: "Хранитель времени",
    description: "Получите три звезды на всех уровнях",
  },
];
