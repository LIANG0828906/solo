import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import StartScreen from '@/components/StartScreen';
import ProgressBar from '@/components/ProgressBar';
import GameBoard from '@/components/GameBoard';
import LevelComplete from '@/components/LevelComplete';
import GameOver from '@/components/GameOver';
import type { Word } from '@/api/wordsApi';

type GameMode = 'spelling' | 'matching';

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    style={{
      width: '24px',
      height: '24px',
      fill: 'currentColor',
    }}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const ArkLogo: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 200 120"
    style={{ color: '#4ECDC4' }}
  >
    <path
      d="M100 20L140 60H60L100 20Z"
      fill="currentColor"
    />
    <path
      d="M95 25V55H105V25H95Z"
      fill="currentColor"
    />
    <path
      d="M40 60H160L145 85H55L40 60Z"
      fill="currentColor"
    />
  </svg>
);

const App: React.FC = () => {
  const screen = useGameStore((state) => state.screen);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const currentDifficulty = useGameStore((state) => state.currentDifficulty);
  const lives = useGameStore((state) => state.lives);
  const totalCorrect = useGameStore((state) => state.totalCorrect);
  const totalAnswered = useGameStore((state) => state.totalAnswered);
  const currentWordIndex = useGameStore((state) => state.currentWordIndex);
  const currentWords = useGameStore((state) => state.currentWords);
  const levelCorrect = useGameStore((state) => state.levelCorrect);
  const farLevel = useGameStore((state) => state.farLevel);
  const totalScore = useGameStore((state) => state.totalScore);
  const userInputHistory = useGameStore((state) => state.userInputHistory);
  const loading = useGameStore((state) => state.loading);

  const startGame = useGameStore((state) => state.startGame);
  const startLevel = useGameStore((state) => state.startLevel);
  const submitAnswer = useGameStore((state) => state.submitAnswer);
  const adjustDifficulty = useGameStore((state) => state.adjustDifficulty);
  const goToScreen = useGameStore((state) => state.goToScreen);
  const nextLevel = useGameStore((state) => state.nextLevel);

  const mode: GameMode = useMemo(() => {
    if (currentWordIndex === 4 || currentWordIndex === 9) {
      return 'matching';
    }
    return 'spelling';
  }, [currentWordIndex]);

  const answered: (boolean | undefined)[] = useMemo(() => {
    const result: (boolean | undefined)[] = new Array(currentWords.length).fill(undefined);
    const currentWordIds = currentWords.map((w) => w.id);
    const historyMap = new Map<string, boolean>();

    for (let i = userInputHistory.length - 1; i >= 0; i--) {
      const record = userInputHistory[i];
      if (currentWordIds.includes(record.wordId) && !historyMap.has(record.wordId)) {
        historyMap.set(record.wordId, record.correct);
      }
    }

    currentWords.forEach((word, index) => {
      if (historyMap.has(word.id)) {
        result[index] = historyMap.get(word.id);
      }
    });

    return result;
  }, [currentWords, userInputHistory]);

  const answeredForProgressBar: boolean[] = useMemo(() => {
    return answered.map((v) => v === true);
  }, [answered]);

  useEffect(() => {
    if (screen === 'levelComplete' && currentWords.length > 0) {
      const correctRate = levelCorrect / currentWords.length;
      adjustDifficulty(correctRate);
    }
  }, [screen, currentWords.length, levelCorrect, adjustDifficulty]);

  const handleStart = useCallback(async () => {
    startGame();
    await startLevel();
  }, [startGame, startLevel]);

  const handleSubmit = useCallback(
    (correct: boolean, submitMode: 'spelling' | 'matching') => {
      const currentWord = currentWords[currentWordIndex];
      if (currentWord) {
        submitAnswer(currentWord.id, correct, submitMode);
      }
    },
    [submitAnswer, currentWords, currentWordIndex]
  );

  const handleNextLevel = useCallback(async () => {
    nextLevel();
    await startLevel();
  }, [nextLevel, startLevel]);

  const handleRestart = useCallback(() => {
    goToScreen('start');
  }, [goToScreen]);

  const navbarStyle: React.CSSProperties = {
    height: '60px',
    width: '100%',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    background: 'rgba(15, 32, 39, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(78, 205, 196, 0.15)',
  };

  const navbarContainerStyle: React.CSSProperties = {
    maxWidth: '960px',
    height: '100%',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const logoTextStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#4ECDC4',
    letterSpacing: '1px',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  };

  const heartsContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const getHeartStyle = (index: number): React.CSSProperties => {
    const isActive = lives >= index + 1;
    return {
      display: 'inline-block',
      color: isActive ? '#FF6B6B' : '#475569',
      opacity: isActive ? 1 : 0.3,
      animation: !isActive ? 'heart-fade 0.3s ease-out forwards' : undefined,
    };
  };

  const mainContentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  };

  const gameContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 20px 80px',
    maxWidth: '960px',
    margin: '0 auto',
    width: '100%',
  };

  const levelInfoStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '32px',
  };

  const levelTextStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#4ECDC4',
    fontWeight: 600,
  };

  const difficultyBadgeStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#94A3B8',
    marginLeft: '12px',
    padding: '2px 8px',
    background: 'rgba(255, 217, 61, 0.15)',
    borderRadius: '10px',
  };

  const scoreTextStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#FFD93D',
    marginLeft: '12px',
  };

  const footerStyle: React.CSSProperties = {
    position: 'sticky',
    bottom: 0,
    width: '100%',
    background: 'rgba(15, 32, 39, 0.95)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid rgba(78, 205, 196, 0.1)',
  };

  const footerContainerStyle: React.CSSProperties = {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '0 20px',
    width: '100%',
  };

  const loadingContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: '400px',
  };

  const spinnerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(78, 205, 196, 0.2)',
    borderTopColor: '#4ECDC4',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />
        </div>
      );
    }

    switch (screen) {
      case 'start':
        return <StartScreen onStart={handleStart} />;

      case 'playing':
        if (currentWords.length === 0) {
          return (
            <div style={loadingContainerStyle}>
              <div style={spinnerStyle} />
            </div>
          );
        }
        return (
          <div style={gameContainerStyle}>
            <div style={levelInfoStyle}>
              <span style={levelTextStyle}>第 {currentLevel} 关</span>
              <span style={difficultyBadgeStyle}>难度：{currentDifficulty}</span>
              <span style={scoreTextStyle}>得分：{totalScore}</span>
            </div>
            <GameBoard
              word={currentWords[currentWordIndex]}
              wordIndex={currentWordIndex}
              totalWords={currentWords.length}
              mode={mode}
              onSubmit={handleSubmit}
            />
          </div>
        );

      case 'levelComplete':
        return (
          <>
            <div style={gameContainerStyle} />
            <LevelComplete
              level={currentLevel}
              correctCount={levelCorrect}
              totalCount={currentWords.length}
              score={levelCorrect * 10}
              difficulty={currentDifficulty}
              onNext={handleNextLevel}
            />
          </>
        );

      case 'gameOver':
        return (
          <>
            <div style={gameContainerStyle} />
            <GameOver
              totalScore={totalScore}
              farLevel={farLevel}
              onRestart={handleRestart}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <nav style={navbarStyle}>
        <div style={navbarContainerStyle}>
          <div style={logoStyle}>
            <ArkLogo />
            <span style={logoTextStyle}>单词方舟</span>
          </div>
          <div style={heartsContainerStyle} key={lives}>
            {[0, 1, 2].map((index) => (
              <span key={index} style={getHeartStyle(index)}>
                <HeartIcon filled={lives >= index + 1} />
              </span>
            ))}
          </div>
        </div>
      </nav>

      <main style={mainContentStyle}>
        {renderContent()}
      </main>

      {screen === 'playing' && !loading && currentWords.length > 0 && (
        <footer style={footerStyle}>
          <div style={footerContainerStyle}>
            <ProgressBar
              total={currentWords.length}
              current={currentWordIndex}
              answered={answeredForProgressBar}
            />
          </div>
        </footer>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes heart-fade {
          to {
            opacity: 0.3;
          }
        }
      `}</style>
    </>
  );
};

export default App;
