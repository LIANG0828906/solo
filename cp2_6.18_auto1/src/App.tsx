import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import GameCanvas from './components/GameCanvas';
import UIPanel from './components/UIPanel';
import { Engine } from './game/Engine';

const App: React.FC = () => {
  const engineRef = useRef<Engine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const restart = useGameStore((s) => s.restart);

  const handleRestart = useCallback(() => {
    restart();
    if (engineRef.current) {
      engineRef.current.restart();
    }
  }, [restart]);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new Engine(canvasRef.current);
      engineRef.current.start();
    }
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <GameCanvas ref={canvasRef} />
      <UIPanel onRestart={handleRestart} />
    </div>
  );
};

export default App;
