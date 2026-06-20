import React, { useEffect } from 'react';
import { GameMap } from './GameMap';
import { GameUI } from './GameUI';
import { startGame, stopGame } from './GameEngine';

const App: React.FC = () => {
  useEffect(() => {
    startGame();
    return () => {
      stopGame();
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0D1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          padding: '80px 40px 80px 40px',
        }}
      >
        <GameMap />
        <GameUI />
      </div>
    </div>
  );
};

export default App;
