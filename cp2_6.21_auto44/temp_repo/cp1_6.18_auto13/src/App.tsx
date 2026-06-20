import React from 'react';
import GameCanvas from './GameCanvas';

const App: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GameCanvas />
    </div>
  );
};

export default App;
