import React, { useCallback } from 'react';
import ArcheryField from './components/ArcheryField';
import { Archer, GameState } from './types';

const App: React.FC = () => {
  const handleScoreUpdate = useCallback((archers: Archer[]) => {
    console.log('Scores updated:', archers);
  }, []);

  const handleGameStateChange = useCallback((state: GameState) => {
    console.log('Game state:', state.phase);
  }, []);

  return (
    <div className="app-container">
      <ArcheryField
        onScoreUpdate={handleScoreUpdate}
        onGameStateChange={handleGameStateChange}
      />
    </div>
  );
};

export default App;
