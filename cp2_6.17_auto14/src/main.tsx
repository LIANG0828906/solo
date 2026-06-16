import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GameEngine } from './GameEngine';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.start();

    return () => {
      engine.stop();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
