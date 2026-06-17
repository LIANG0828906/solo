import { useEffect, useRef } from 'react';
import { InfoBar } from './InfoBar';
import { GameBoard } from './GameBoard';
import { TowerPanel } from './TowerPanel';
import { useGameStore } from '../store/store';

export function App() {
  const initEngine = useGameStore((state) => state.initEngine);
  const updateEngine = useGameStore((state) => state.updateEngine);
  const setFps = useGameStore((state) => state.setFps);
  const gameOver = useGameStore((state) => state.gameOver);
  const victory = useGameStore((state) => state.victory);
  const resetGame = useGameStore((state) => state.resetGame);

  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(0);
  const skipFrameRef = useRef<number>(0);

  useEffect(() => {
    initEngine();
  }, [initEngine]);

  useEffect(() => {
    let animationId: number;
    let running = true;

    const gameLoop = (timestamp: number) => {
      if (!running) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTimeMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      const deltaTime = deltaTimeMs / 1000;

      frameCountRef.current++;
      fpsTimerRef.current += deltaTimeMs;
      if (fpsTimerRef.current >= 500) {
        const currentFps = (frameCountRef.current * 1000) / fpsTimerRef.current;
        setFps(currentFps);
        frameCountRef.current = 0;
        fpsTimerRef.current = 0;

        if (currentFps < 25) {
          skipFrameRef.current = 1;
        } else if (currentFps < 30) {
          skipFrameRef.current = 0;
        } else {
          skipFrameRef.current = 0;
        }
      }

      if (skipFrameRef.current > 0) {
        skipFrameRef.current--;
      } else {
        updateEngine(timestamp, deltaTime);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      running = false;
      cancelAnimationFrame(animationId);
    };
  }, [updateEngine, setFps]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#2D2D1E',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <InfoBar />
      <GameBoard />
      <TowerPanel />

      {(gameOver || victory) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            gap: 24,
          }}
        >
          <div
            style={{
              color: '#FFFFFF',
              fontSize: 36,
              fontFamily: 'monospace',
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            {victory ? '胜利！' : '游戏结束'}
          </div>
          <button
            onClick={resetGame}
            style={{
              width: 180,
              height: 48,
              backgroundColor: '#6B8E23',
              color: '#FFFFFF',
              fontSize: 18,
              fontFamily: 'monospace',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'transform 0.1s, background-color 0.1s',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6B8E23';
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#556B2F';
            }}
          >
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}
