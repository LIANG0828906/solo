import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';

export default function App() {
  const initEngine = useGameStore((s) => s.initEngine);
  const updateGame = useGameStore((s) => s.updateGame);
  const resizeCanvas = useGameStore((s) => s.resizeCanvas);
  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    initEngine(window.innerWidth, window.innerHeight);

    const handleResize = () => {
      resizeCanvas(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ') e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const gameLoop = useCallback((time: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
    }
    let dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    dt = Math.min(dt, 0.05);

    updateGame(dt, keysRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameCanvas />
      <HUD />
    </div>
  );
}
