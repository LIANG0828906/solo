import { useState, useCallback } from 'react';
import type { GameState, HUDData } from './core/types';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';

const initialHUDData: HUDData = {
  health: 3,
  maxHealth: 3,
  combo: 0,
  score: 0,
  comboFlash: false,
  specialCooldown: 0,
  specialMaxCooldown: 8,
  specialReady: true,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [hudData, setHudData] = useState<HUDData>(initialHUDData);
  const [finalScore, setFinalScore] = useState(0);

  const handleStart = useCallback(() => {
    setHudData(initialHUDData);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback(() => {
    setFinalScore(hudData.score);
    setGameState('gameover');
  }, [hudData.score]);

  const handleRestart = useCallback(() => {
    setHudData(initialHUDData);
    setGameState('playing');
  }, []);

  const handleHUDUpdate = useCallback((data: HUDData) => {
    setHudData(data);
  }, []);

  if (gameState === 'start') {
    return <StartScreen onStart={handleStart} />;
  }

  if (gameState === 'gameover') {
    return <GameOverScreen score={finalScore} onRestart={handleRestart} />;
  }

  return (
    <div className="game-wrapper">
      <GameCanvas onHUDUpdate={handleHUDUpdate} onGameOver={handleGameOver} />
      <HUD data={hudData} />
    </div>
  );
}
