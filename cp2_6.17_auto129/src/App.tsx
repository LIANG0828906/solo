import { useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIPanel } from './components/UIPanel';
import { GameEngine } from './game/Engine';

function App() {
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    engineRef.current = new GameEngine();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A1A',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '800px',
          height: '600px',
        }}
      >
        <GameCanvas engineRef={engineRef} />
        <UIPanel engineRef={engineRef} />
      </div>
    </div>
  );
}

export default App;
