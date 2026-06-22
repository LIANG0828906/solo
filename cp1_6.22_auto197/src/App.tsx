import { useState, useEffect, useCallback } from 'react';
import MainMenu from './components/MainMenu';
import LevelSelect from './components/LevelSelect';
import GameScreen from './components/GameScreen';
import type { Screen } from './types';

const STORAGE_KEY = 'time_rewind_progress';

function loadProgress(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as number[];
      return new Set(arr);
    }
  } catch {}
  return new Set();
}

function saveProgress(completed: Set<number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completed)));
  } catch {}
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(() => loadProgress());
  const [transitioning, setTransitioning] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    saveProgress(completedLevels);
  }, [completedLevels]);

  const navigateTo = useCallback((target: Screen, levelId?: number) => {
    setTransitioning(true);
    setFadeIn(false);
    setTimeout(() => {
      if (levelId !== undefined) {
        setCurrentLevel(levelId);
      }
      setScreen(target);
      setTimeout(() => {
        setFadeIn(true);
        setTransitioning(false);
      }, 50);
    }, 300);
  }, []);

  const handleStartGame = useCallback(() => {
    navigateTo('levelSelect');
  }, [navigateTo]);

  const handleSelectLevel = useCallback((id: number) => {
    navigateTo('playing', id);
  }, [navigateTo]);

  const handleBackToMenu = useCallback(() => {
    navigateTo('menu');
  }, [navigateTo]);

  const handleBackToLevelSelect = useCallback(() => {
    navigateTo('levelSelect');
  }, [navigateTo]);

  const handleLevelComplete = useCallback((levelId: number) => {
    setCompletedLevels(prev => {
      const next = new Set(prev);
      next.add(levelId);
      return next;
    });
  }, []);

  const handleGameOver = useCallback(() => {
    navigateTo('menu');
  }, [navigateTo]);

  const handleNextLevel = useCallback(() => {
    const nextId = currentLevel + 1;
    if (nextId <= 3) {
      navigateTo('playing', nextId);
    } else {
      navigateTo('levelSelect');
    }
  }, [currentLevel, navigateTo]);

  const transitionStyle = {
    opacity: fadeIn ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out'
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1A202C 0%, #2D2A4A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...transitionStyle
      }}
    >
      {screen === 'menu' && (
        <MainMenu
          onStart={handleStartGame}
          completedCount={completedLevels.size}
          totalLevels={3}
        />
      )}
      {screen === 'levelSelect' && (
        <LevelSelect
          completedLevels={completedLevels}
          onSelectLevel={handleSelectLevel}
          onBack={handleBackToMenu}
        />
      )}
      {screen === 'playing' && (
        <GameScreen
          levelId={currentLevel}
          onComplete={handleLevelComplete}
          onNextLevel={handleNextLevel}
          onGameOver={handleGameOver}
          onBack={handleBackToLevelSelect}
        />
      )}
      {transitioning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#1A202C',
            opacity: fadeIn ? 0 : 1,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 9999
          }}
        />
      )}
    </div>
  );
}
