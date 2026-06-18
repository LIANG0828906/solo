import React from 'react';
import { useGameStore } from './store';
import { LevelSelect } from './components/LevelSelect';
import { GameCanvas } from './components/GameCanvas';

const App: React.FC = () => {
  const currentView = useGameStore((s) => s.currentView);
  return <>{currentView === 'menu' ? <LevelSelect /> : <GameCanvas />}</>;
};

export default App;
