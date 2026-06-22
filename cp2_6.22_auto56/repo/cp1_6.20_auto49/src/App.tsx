import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        id="canvas-container"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default App;
