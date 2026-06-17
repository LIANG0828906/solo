import React, { useEffect } from 'react';
import MapView from './mapComponents/MapView';
import Sidebar from './mapComponents/Sidebar';
import { useSoundMapStore } from './store';

const App: React.FC = () => {
  const loadInitData = useSoundMapStore((s) => s.loadInitData);

  useEffect(() => {
    loadInitData();
  }, [loadInitData]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <Sidebar />
      <MapView />
    </div>
  );
};

export default App;
