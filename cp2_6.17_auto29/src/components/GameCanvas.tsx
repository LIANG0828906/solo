import { useEffect, useRef } from 'react';
import { LevelEngine } from '../level/LevelEngine';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<LevelEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new LevelEngine(canvasRef.current);
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={960}
      height={640}
      className="game-canvas"
      style={{ display: 'block' }}
    />
  );
}
