import { useRef, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { SceneRenderer } from './renderer/SceneRenderer';
import { ParameterPanel } from './modules/ParameterPanel';

function AppContent() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRendererRef = useRef<SceneRenderer | null>(null);
  const { params } = useAppContext();

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const renderer = new SceneRenderer(canvasContainerRef.current);
    sceneRendererRef.current = renderer;
    renderer.start();

    renderer.setCycloneType(params.cycloneType);
    renderer.setWindSpeed(params.windSpeed);
    renderer.setDensity(params.particleDensity);

    const handleResetCamera = () => {
      if (sceneRendererRef.current) {
        sceneRendererRef.current.resetCamera();
      }
    };

    window.addEventListener('resetCamera', handleResetCamera);

    return () => {
      window.removeEventListener('resetCamera', handleResetCamera);
      renderer.dispose();
      sceneRendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (sceneRendererRef.current) {
      sceneRendererRef.current.setCycloneType(params.cycloneType);
      sceneRendererRef.current.setWindSpeed(params.windSpeed);
      sceneRendererRef.current.setDensity(params.particleDensity);
    }
  }, [params.cycloneType, params.windSpeed, params.particleDensity]);

  return (
    <div className="app-container">
      <div className="canvas-container" ref={canvasContainerRef} />
      <ParameterPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
