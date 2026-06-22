import React, { useEffect } from 'react';
import { Canvas } from './modules/mindmap/Canvas';
import { Sidebar } from './modules/panel/Sidebar';
import { HistoryPanel } from './modules/panel/HistoryPanel';
import { useMindMapStore } from './modules/mindmap/store';

export const App: React.FC = () => {
  const { initStore } = useMindMapStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Sidebar />
      <Canvas />
      <HistoryPanel />
    </div>
  );
};
