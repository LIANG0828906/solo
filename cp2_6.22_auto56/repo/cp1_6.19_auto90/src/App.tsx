import { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import './styles/game.css';

export default function App() {
  const [gameKey, setGameKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGameOver = useCallback((score: number) => {
    setIsPlaying(false);
  }, []);

  const handleStart = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleRestart = useCallback((width: number, height: number) => {
    setGameKey(prev => prev + 1);
    setIsPlaying(true);
  }, []);

  return (
    <GameCanvas
      onGameOver={handleGameOver}
      gameKey={gameKey}
      onStart={handleStart}
      onRestart={handleRestart}
      isPlaying={isPlaying}
    />
  );
}
