import React from 'react';
import { Canvas } from './ui/Canvas';
import { Toolbar } from './ui/Toolbar';
import { VersionPanel } from './ui/VersionPanel';
import { StatusBar } from './ui/StatusBar';
import { useBoardStore } from './stores/boardStore';

export const App: React.FC = () => {
  const { showVersionPanel, setShowVersionPanel } = useBoardStore();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#F8F8F2',
      position: 'relative',
    }}>
      <Canvas />
      <Toolbar />
      <StatusBar />
      <VersionPanel open={showVersionPanel} onClose={() => setShowVersionPanel(false)} />

      {showVersionPanel && (
        <div
          onClick={() => setShowVersionPanel(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(45,45,68,0.08)',
            zIndex: 180,
            pointerEvents: 'auto',
          }}
        />
      )}
    </div>
  );
};
