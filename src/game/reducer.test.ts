import { describe, expect, it } from "vitest";
import type { Question } from "../data/types";
import { createInitialGameState, gameReducer } from "./reducer";
import { defaultFilters } from "./types";

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

function startLevelWithQuestions(mode: "lives" | "god", questionCount: number) {
  let state = createInitialGameState();
  state = gameReducer(state, { type: "SELECT_MODE", mode, filters: defaultFilters, startLevel: 1 });
  state = gameReducer(state, { type: "START_LEVEL", level: 1 });
  state = gameReducer(state, { type: "LEVEL_LOADED", questions: makeQuestions(questionCount) });
  return state;
}

/** Answers the current question wrong or right, then advances with NEXT (unless the run just ended). */
function answerAndAdvance(state: ReturnType<typeof startLevelWithQuestions>, correct: boolean) {
  const optionId = correct ? "a" : "b";
  let next = gameReducer(state, { type: "SELECT_ANSWER", optionId });
  next = gameReducer(next, { type: "NEXT" });
  return next;
}

describe("gameReducer: режим «Жизни» завершается именно при шестой ошибке", () => {
  it("первые пять ошибок не завершают игру", () => {
    let state = startLevelWithQuestions("lives", 30);
    for (let i = 0; i < 5; i += 1) {
      state = answerAndAdvance(state, false);
      expect(state.stage).not.toBe("game-result");
    }
    expect(state.totalMistakes).toBe(5);
    expect(state.stage).toBe("question");
  });

  it("шестая ошибка немедленно завершает игру с причиной too-many-mistakes", () => {
    let state = startLevelWithQuestions("lives", 30);
    for (let i = 0; i < 5; i += 1) {
      state = answerAndAdvance(state, false);
    }
    // Sixth mistake.
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "b" });
    expect(state.stage).toBe("answer-result");
    state = gameReducer(state, { type: "NEXT" });
    expect(state.stage).toBe("game-result");
    expect(state.finishReason).toBe("too-many-mistakes");
    expect(state.totalMistakes).toBe(6);
  });
});

describe("gameReducer: режим «Бог» не ограничивает количество ошибок", () => {
  it("не завершает игру даже после многих ошибок подряд", () => {
    let state = startLevelWithQuestions("god", 30);
    for (let i = 0; i < 15; i += 1) {
      state = answerAndAdvance(state, false);
      expect(state.stage).not.toBe("game-result");
    }
    expect(state.totalMistakes).toBe(15);
  });
});

describe("gameReducer: защита от двойной обработки ответа", () => {
  it("повторный SELECT_ANSWER после блокировки не меняет состояние", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });
    const scoreAfterFirstAnswer = state.score;
    const streakAfterFirstAnswer = state.currentStreak;

    // Try answering again (should be ignored because isAnswerLocked is true).
    const stateAfterSecondAttempt = gameReducer(state, { type: "SELECT_ANSWER", optionId: "b" });

    expect(stateAfterSecondAttempt.score).toBe(scoreAfterFirstAnswer);
    expect(stateAfterSecondAttempt.currentStreak).toBe(streakAfterFirstAnswer);
    expect(stateAfterSecondAttempt.answeredQuestions).toBe(1);
    expect(stateAfterSecondAttempt.selectedOptionId).toBe("a");
  });

  it("не начисляет очки дважды за один и тот же вопрос", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });
    expect(state.score).toBe(100);
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });
    expect(state.score).toBe(100);
  });
});

describe("gameReducer: истечение времени на вопрос (таймер)", () => {
  it("TIME_EXPIRED засчитывается как неверный ответ без выбранного варианта", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = gameReducer(state, { type: "TIME_EXPIRED" });

    expect(state.stage).toBe("answer-result");
    expect(state.timedOut).toBe(true);
    expect(state.selectedOptionId).toBeNull();
    expect(state.wrongAnswers).toBe(1);
    expect(state.mistakesInLevel).toBe(1);
    expect(state.totalMistakes).toBe(1);
    expect(state.score).toBe(0);
  });

  it("сбрасывает серию правильных ответов при истечении времени", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = answerAndAdvance(state, true);
    state = answerAndAdvance(state, true);
    expect(state.currentStreak).toBe(2);

    state = gameReducer(state, { type: "TIME_EXPIRED" });
    expect(state.currentStreak).toBe(0);
  });

  it("шестая ошибка от истечения времени тоже завершает режим «Жизни»", () => {
    let state = startLevelWithQuestions("lives", 30);
    for (let i = 0; i < 5; i += 1) {
      state = gameReducer(state, { type: "TIME_EXPIRED" });
      state = gameReducer(state, { type: "NEXT" });
    }
    state = gameReducer(state, { type: "TIME_EXPIRED" });
    state = gameReducer(state, { type: "NEXT" });
    expect(state.stage).toBe("game-result");
    expect(state.finishReason).toBe("too-many-mistakes");
  });

  it("клик после истечения времени (гонка) игнорируется — защита от двойной обработки", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = gameReducer(state, { type: "TIME_EXPIRED" });
    const afterTimeout = state;

    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });

    expect(state).toEqual(afterTimeout);
  });

  it("сбрасывает timedOut при переходе к следующему вопросу", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = gameReducer(state, { type: "TIME_EXPIRED" });
    expect(state.timedOut).toBe(true);
    state = gameReducer(state, { type: "NEXT" });
    expect(state.timedOut).toBe(false);
  });
});

describe("gameReducer: дедлайн таймера вопроса (для восстановления после перезагрузки)", () => {
  it("устанавливает дедлайн в будущем при загрузке уровня", () => {
    const before = Date.now();
    const state = startLevelWithQuestions("lives", 30);
    expect(state.questionDeadlineAt).not.toBeNull();
    expect(state.questionDeadlineAt as number).toBeGreaterThan(before);
  });

  it("сбрасывает дедлайн после ответа", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });
    expect(state.questionDeadlineAt).toBeNull();
  });

  it("устанавливает новый дедлайн при переходе к следующему вопросу", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });
    const before = Date.now();
    state = gameReducer(state, { type: "NEXT" });
    expect(state.questionDeadlineAt).not.toBeNull();
    expect(state.questionDeadlineAt as number).toBeGreaterThanOrEqual(before);
  });
});

describe("gameReducer: выход из игры", () => {
  it("GO_HOME сбрасывает состояние независимо от того, на каком этапе была игра", () => {
    let state = startLevelWithQuestions("lives", 30);
    state = answerAndAdvance(state, false);
    state = gameReducer(state, { type: "GO_HOME" });

    expect(state).toEqual(createInitialGameState());
  });
});

describe("gameReducer: завершение уровня и переход между уровнями", () => {
  it("после 30-го вопроса переходит на экран результата уровня", () => {
    let state = startLevelWithQuestions("god", 30);
    for (let i = 0; i < 29; i += 1) {
      state = answerAndAdvance(state, true);
    }
    // Last (30th) question.
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });
    state = gameReducer(state, { type: "NEXT" });
    expect(state.stage).toBe("level-result");
    expect(state.levelOutcomes).toHaveLength(1);
    expect(state.levelOutcomes[0].total).toBe(30);
  });

  it("уровень без ошибок получает 3 звезды и бонус за безошибочность", () => {
    let state = startLevelWithQuestions("god", 30);
    for (let i = 0; i < 29; i += 1) {
      state = answerAndAdvance(state, true);
    }
    state = gameReducer(state, { type: "SELECT_ANSWER", optionId: "a" });
    state = gameReducer(state, { type: "NEXT" });
    expect(state.levelOutcomes[0].stars).toBe(3);
  });
});
