import { useEffect, useRef } from 'react';
import Renderer from './core/Renderer';
import MagnetPanel from './components/MagnetPanel';
import './App.css';

function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    if (canvasContainerRef.current && !rendererRef.current) {
      rendererRef.current = new Renderer(canvasContainerRef.current);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  return (
    <div className="app-container">
      <div ref={canvasContainerRef} className="canvas-container" />
      <MagnetPanel />
    </div>
  );
}

export default App;
