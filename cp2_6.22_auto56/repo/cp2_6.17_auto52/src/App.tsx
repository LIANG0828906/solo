import React from 'react';
import GameCanvas from './render/GameCanvas';
import UIOverlay from './render/UIOverlay';

const App: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <GameCanvas />
      <UIOverlay />
    </div>
  );
};

export default App;
