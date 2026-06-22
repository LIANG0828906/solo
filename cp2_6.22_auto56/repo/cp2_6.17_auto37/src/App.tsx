import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore, CANVAS_WIDTH, CANVAS_HEIGHT } from './level/gameStore';
import { setupInputHandlers, gameLoop } from './level/GameEngine';
import { SonarSystem } from './audio/SonarSystem';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sonarRef = useRef<SonarSystem | null>(null);
  const audioUpdateRef = useRef<number>(0);
  const [scale, setScale] = useState(1);

  const resizeCanvas = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    const viewRatio = vw / vh;

    let newScale: number;
    if (viewRatio > targetRatio) {
      newScale = vh / CANVAS_HEIGHT;
    } else {
      newScale = vw / CANVAS_WIDTH;
    }
    newScale = Math.max(0.2, Math.min(2, newScale));
    setScale(newScale);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const cleanupInput = setupInputHandlers(canvas);
    const cleanupLoop = gameLoop(canvas);

    const initAudio = () => {
      if (!sonarRef.current) {
        sonarRef.current = new SonarSystem();
        sonarRef.current.init();
      }
      sonarRef.current?.resume();
    };

    const handleFirstInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    const audioUpdate = () => {
      if (sonarRef.current) {
        sonarRef.current.update();
      }
      audioUpdateRef.current = requestAnimationFrame(audioUpdate);
    };
    audioUpdateRef.current = requestAnimationFrame(audioUpdate);

    return () => {
      cleanupInput();
      cleanupLoop();
      cancelAnimationFrame(audioUpdateRef.current);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      sonarRef.current?.destroy();
      sonarRef.current = null;
    };
  }, []);

  const displayWidth = CANVAS_WIDTH * scale;
  const displayHeight = CANVAS_HEIGHT * scale;

  return (
    <div ref={containerRef} className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          maxWidth: '100vw',
          maxHeight: '100vh'
        }}
      />
    </div>
  );
}
