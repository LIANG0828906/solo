import React from 'react';
import Sundial from './components/Sundial';

const App: React.FC = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Sundial />
    </div>
  );
};

export default App;
