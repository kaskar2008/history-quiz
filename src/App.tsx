import { useRef, useState } from "react";
import { AchievementToastHost } from "./components/AchievementToast";
import { ExitConfirmDialog } from "./components/ExitConfirmDialog";
import { useGame } from "./hooks/useGame";
import { AchievementsScreen } from "./screens/AchievementsScreen";
import { GameResultScreen } from "./screens/GameResultScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { LevelMapScreen } from "./screens/LevelMapScreen";
import { LevelResultScreen } from "./screens/LevelResultScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { ModeSelectionScreen } from "./screens/ModeSelectionScreen";
import { QuestionScreen } from "./screens/QuestionScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";
import { TOTAL_LEVELS } from "./game/types";

type AppView = "game" | "statistics" | "achievements";

function App() {
  const {
    state,
    progress,
    goHome,
    goToModeSelection,
    selectMode,
    startLevel,
    selectAnswer,
    timeExpired,
    next,
  } = useGame();
  const [view, setView] = useState<AppView>("game");
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const exitTriggerRef = useRef<HTMLElement | null>(null);

  const requestExit = () => {
    exitTriggerRef.current = document.activeElement as HTMLElement | null;
    setIsExitConfirmOpen(true);
  };
  const cancelExit = () => setIsExitConfirmOpen(false);
  const confirmExit = () => {
    setIsExitConfirmOpen(false);
    goHome();
  };

  if (view === "statistics") {
    return <StatisticsScreen progress={progress} onBack={() => setView("game")} />;
  }

  if (view === "achievements") {
    return <AchievementsScreen progress={progress} onBack={() => setView("game")} />;
  }

  return (
    <>
      <AchievementToastHost unlockedIds={state.newAchievements} />
      <ExitConfirmDialog
        isOpen={isExitConfirmOpen}
        onCancel={cancelExit}
        onConfirm={confirmExit}
        returnFocusRef={exitTriggerRef}
      />

      {state.stage === "home" && (
        <HomeScreen
          progress={progress}
          onStart={goToModeSelection}
          onOpenStatistics={() => setView("statistics")}
          onOpenAchievements={() => setView("achievements")}
        />
      )}

      {state.stage === "mode-selection" && (
        <ModeSelectionScreen onSelect={(mode) => selectMode(mode)} onBack={goHome} />
      )}

      {state.stage === "level-map" && state.mode && (
        <LevelMapScreen
          mode={state.mode}
          currentLevel={state.currentLevel}
          progress={progress}
          error={state.error}
          onStart={() => startLevel(state.currentLevel)}
          onBack={goHome}
        />
      )}

      {state.stage === "loading" && <LoadingScreen level={state.currentLevel} onRequestExit={requestExit} />}

      {(state.stage === "question" || state.stage === "answer-result") &&
        state.mode &&
        state.levelQuestions[state.questionIndex] && (
          <QuestionScreen
            question={state.levelQuestions[state.questionIndex]}
            stage={state.stage}
            selectedOptionId={state.selectedOptionId}
            timedOut={state.timedOut}
            questionDeadlineAt={state.questionDeadlineAt}
            mode={state.mode}
            level={state.currentLevel}
            questionIndex={state.questionIndex}
            totalQuestions={state.levelQuestions.length}
            score={state.score}
            currentStreak={state.currentStreak}
            totalMistakes={state.totalMistakes}
            onSelectAnswer={selectAnswer}
            onTimeExpired={timeExpired}
            onNext={next}
            onRequestExit={requestExit}
          />
        )}

      {state.stage === "level-result" && state.levelOutcomes.length > 0 && (
        <LevelResultScreen
          outcome={state.levelOutcomes[state.levelOutcomes.length - 1]}
          isLastLevel={state.currentLevel >= TOTAL_LEVELS}
          onNext={next}
          onRequestExit={requestExit}
        />
      )}

      {state.stage === "game-result" && state.mode && state.finishReason && (
        <GameResultScreen
          mode={state.mode}
          finishReason={state.finishReason}
          score={state.score}
          correctAnswers={state.correctAnswers}
          wrongAnswers={state.wrongAnswers}
          answeredQuestions={state.answeredQuestions}
          maxStreak={state.maxStreak}
          highestLevelReached={state.currentLevel}
          newAchievements={state.newAchievements}
          isNewRecord={state.isNewRecord}
          previousRecordScore={state.previousRecordScore}
          onPlayAgain={goToModeSelection}
          onGoHome={goHome}
        />
      )}
    </>
  );
}

export default App;
