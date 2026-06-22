import { useEffect, useRef } from 'react';
import { PlanetRenderer } from './PlanetRenderer';
import { timeSimulator } from './TimeSimulator';
import { userInteractionModule } from './UserInteractionModule';
import UIOverlay from './UIOverlay';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PlanetRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new PlanetRenderer(canvas);
    rendererRef.current = renderer;

    userInteractionModule.initialize(
      canvas,
      renderer.camera,
      renderer.scene
    );

    timeSimulator.start();
    renderer.start();

    const handleResize = () => {
      renderer.onWindowResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.stop();
      timeSimulator.stop();
      userInteractionModule.dispose();
    };
  }, []);

  return (
    <div className="scene-container">
      <canvas ref={canvasRef} className="scene-canvas" />
      <UIOverlay />
    </div>
  );
}

export default App;
