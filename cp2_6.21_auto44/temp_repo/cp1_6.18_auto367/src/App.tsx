import React from 'react';
import { InfoPanel } from './InfoPanel';
import { GameCanvas } from './GameCanvas';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <InfoPanel />
      <GameCanvas />
    </div>
  );
};

export default App;
