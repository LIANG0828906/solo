import React from 'react';
import Board from './Board';
import InfoPanel from './InfoPanel';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="game-wrapper">
        <Board />
        <InfoPanel />
      </div>
    </div>
  );
};

export default App;
