import { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Scene, { type SceneHandle } from './scene';
import { Title, TimeControl, DataPanel, SettingsPanel } from './ui';

function App() {
  const sceneRef = useRef<SceneHandle>(null);

  const handleResetCamera = () => {
    sceneRef.current?.resetCamera();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#0A0A1A',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Scene ref={sceneRef} />
      </div>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <Title />
        </div>
        <div style={{ pointerEvents: 'auto' }}>
          <TimeControl />
        </div>
        <div style={{ pointerEvents: 'auto' }}>
          <DataPanel />
        </div>
        <div style={{ pointerEvents: 'auto' }}>
          <SettingsPanel onResetCamera={handleResetCamera} />
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
