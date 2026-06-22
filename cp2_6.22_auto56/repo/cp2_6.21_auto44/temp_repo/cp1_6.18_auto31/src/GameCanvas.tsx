import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './gameEngine';
import { useGameStore } from './store';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const phase = useGameStore((s) => s.phase);

  const addScore = useGameStore((s) => s.addScore);
  const setCombo = useGameStore((s) => s.setCombo);
  const collectNote = useGameStore((s) => s.collectNote);
  const endGame = useGameStore((s) => s.endGame);

  const initEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (engineRef.current) {
      engineRef.current.destroy();
    }
    const engine = new GameEngine(canvas, {
      onScore: addScore,
      onCombo: setCombo,
      onCollectNote: collectNote,
      onEndGame: endGame,
      onPhaseChange: () => {},
    });
    engineRef.current = engine;
  }, [addScore, setCombo, collectNote, endGame]);

  useEffect(() => {
    initEngine();
    return () => {
      engineRef.current?.destroy();
    };
  }, [initEngine]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (phase === 'running') {
      engine.start();
    } else if (phase === 'paused') {
      engine.pause();
    } else if (phase === 'idle') {
      engine.reset();
    }
  }, [phase]);

  useEffect(() => {
    const handleResize = () => {
      engineRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
}
