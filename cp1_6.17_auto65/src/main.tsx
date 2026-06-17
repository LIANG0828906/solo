import React, { useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GameEngine } from './gameEngine';
import { useGameStore } from './store';
import { UI } from './ui';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const setGameState = useGameStore((s) => s.setGameState);
  const setScore = useGameStore((s) => s.setScore);
  const setLives = useGameStore((s) => s.setLives);
  const setProgress = useGameStore((s) => s.setProgress);
  const setFlashRed = useGameStore((s) => s.setFlashRed);
  const setBpm = useGameStore((s) => s.setBpm);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (engineRef.current) {
      engineRef.current.resize();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.setCallbacks({
      onStateChange: setGameState,
      onScoreChange: setScore,
      onLivesChange: setLives,
      onProgressChange: setProgress,
      onFlashRed: setFlashRed,
      onBpmChange: setBpm,
    });

    window.addEventListener('resize', resizeCanvas);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
      }
      engine.handleKeyDown(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const startBtn = document.getElementById('start-btn');
    const handleStartClick = () => {
      if (useGameStore.getState().state === 'idle') {
        engine.start();
      }
    };
    startBtn?.addEventListener('click', handleStartClick);

    const restartBtn = document.getElementById('restart-btn');
    const handleRestartClick = () => {
      if (useGameStore.getState().state === 'gameover') {
        engine.restart();
      }
    };
    restartBtn?.addEventListener('click', handleRestartClick);

    const idleLoop = () => {
      const ctx = canvas.getContext('2d')!;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(0, 0, w, h);

      const groundY = h - 80;
      ctx.strokeStyle = '#4ECDC440';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY + 20);
      ctx.lineTo(w, groundY + 20);
      ctx.stroke();

      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(120, groundY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(115, groundY - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1A1A2E';
      ctx.beginPath();
      ctx.arc(116, groundY - 3, 2, 0, Math.PI * 2);
      ctx.fill();

      if (useGameStore.getState().state === 'idle') {
        requestAnimationFrame(idleLoop);
      }
    };
    idleLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      startBtn?.removeEventListener('click', handleStartClick);
      restartBtn?.removeEventListener('click', handleRestartClick);
      engine.destroy();
    };
  }, [resizeCanvas, setGameState, setScore, setLives, setProgress, setFlashRed, setBpm]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
      <UI />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
