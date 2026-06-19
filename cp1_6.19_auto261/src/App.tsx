import React from 'react';
import Sidebar from './components/Sidebar';
import Scene3D from './components/Scene3D';
import HistoryPanel from './components/HistoryPanel';

const App: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#F2F2F2',
        overflow: 'hidden',
      }}
    >
      <Sidebar />
      <Scene3D />
      <HistoryPanel />
    </div>
  );
};

export default App;
