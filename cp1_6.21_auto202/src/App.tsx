import React from 'react';
import { TerrainProvider } from './terrainEngine';
import ToolUI from './toolUI';

const App: React.FC = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#0F172A',
      }}
    >
      <TerrainProvider>
        <ToolUI />
      </TerrainProvider>
    </div>
  );
};

export default App;
