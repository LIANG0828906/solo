import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { CommandPanel } from './ui/CommandPanel';
import PhaserGame from './ui/PhaserGame';

const App: React.FC = () => {
  const reset = useGameStore((s) => s.reset);

  useEffect(() => {
    const handleReset = () => {
      reset();
    };
    window.addEventListener('game-reset', handleReset);
    return () => window.removeEventListener('game-reset', handleReset);
  }, [reset]);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CommandPanel />
      <PhaserGame />
    </div>
  );
};

export default App;
