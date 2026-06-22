import { useRef, useEffect, useCallback, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/types';
import type { HUDData } from '../core/types';
import { GameEngine } from '../core/GameEngine';

interface GameCanvasProps {
  onHUDUpdate: (data: HUDData) => void;
  onGameOver: () => void;
}

export default function GameCanvas({ onHUDUpdate, onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [scale, setScale] = useState(1);

  const handleResize = useCallback(() => {
    const windowWidth = window.innerWidth;
    if (windowWidth < 800) {
      setScale(windowWidth / CANVAS_WIDTH);
    } else {
      setScale(1);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, onHUDUpdate, onGameOver);
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [onHUDUpdate, onGameOver]);

  return (
    <div
      className="game-wrapper"
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
    </div>
  );
}
