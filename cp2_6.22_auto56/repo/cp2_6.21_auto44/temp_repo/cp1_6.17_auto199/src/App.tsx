import React, { useEffect, useState, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { physicsEngine } from './engine/PhysicsEngine';
import { useGameStore } from './engine/StateSync';

const App: React.FC = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isPlaying = useGameStore((s) => s.isPlaying);
  const startedRef = useRef(false);

  useEffect(() => {
    const onResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isPlaying && !startedRef.current) {
      startedRef.current = true;
      physicsEngine.start();
    } else if (!isPlaying && startedRef.current) {
      physicsEngine.stop();
      startedRef.current = false;
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      physicsEngine.stop();
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0B0E14',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GameCanvas width={size.width} height={size.height} />
      <HUD />
    </div>
  );
};

export default App;
