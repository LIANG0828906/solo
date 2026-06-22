import React from 'react';
import { useGameStore } from './store/gameStore';
import { CardCollection } from './ui/CardCollection';
import { GameBoard } from './ui/GameBoard';

const App: React.FC = () => {
  const currentView = useGameStore((s) => s.currentView);

  return (
    <div className="app-container">
      {currentView === 'collection' ? <CardCollection /> : <GameBoard />}
    </div>
  );
};

export default App;
