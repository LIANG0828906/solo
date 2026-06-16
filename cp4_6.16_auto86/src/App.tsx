import React, { useEffect } from 'react';
import BuildTripPage from './pages/BuildTripPage';
import ListPage from './pages/ListPage';
import { useTripStore } from './store';

const App: React.FC = () => {
  const { currentTripId, setCurrentTripId, hydrated, hydrate } = useTripStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAF5EB' }}>
        <div style={{ textAlign: 'center', color: '#4A90D9' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎒</div>
          <div style={{ fontSize: 18 }}>Loading NomadPack...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF5EB' }}>
      {currentTripId ? (
        <ListPage onBack={() => setCurrentTripId(null)} />
      ) : (
        <BuildTripPage />
      )}
    </div>
  );
};

export default App;
