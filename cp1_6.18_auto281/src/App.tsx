import React from 'react';
import GameScene from './components/GameScene';
import HUD from './components/HUD';

const App: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GameScene />
      <HUD />
    </div>
  );
};

export default App;
