import React from 'react';
import PuzzleCanvas from './components/PuzzleCanvas';
import Toolbar from './components/Toolbar';

const App: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <PuzzleCanvas />
      </div>
      <Toolbar />
    </div>
  );
};

export default App;
