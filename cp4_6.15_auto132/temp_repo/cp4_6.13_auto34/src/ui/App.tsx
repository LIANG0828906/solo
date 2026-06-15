import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameEngine } from '../modules/game/GameEngine';
import TopBar from './components/TopBar';
import MapView from './components/MapView';
import RepairPanel from './components/RepairPanel';
import DivingView from './components/DivingView';
import EventLog from './components/EventLog';
import StatusBar from './components/StatusBar';
import SearchModal from './components/SearchModal';
import GameOverlay from './components/GameOverlay';

const App: React.FC = () => {
  const gameView = useGameStore((s) => s.gameView);
  const gamePhase = useGameStore((s) => s.gamePhase);

  useEffect(() => {
    gameEngine.start();
    return () => {
      gameEngine.stop();
    };
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        gap: 12,
        backgroundColor: '#0a192f',
        backgroundImage: `
          radial-gradient(ellipse at 20% 30%, rgba(13, 59, 102, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(16, 42, 67, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(10, 25, 47, 1) 0%, rgba(2, 12, 27, 1) 100%)
        `,
        overflow: 'hidden',
      }}
    >
      <TopBar />

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gridTemplateRows: '1fr auto',
          gridTemplateAreas: `
            "main right"
            "status status"
          `,
          gap: 12,
          minHeight: 0,
        }}
      >
        <div
          style={{
            gridArea: 'main',
            display: 'flex',
            gap: 12,
            minHeight: 0,
          }}
        >
          {gameView === 'map' ? (
            <>
              <div
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  alignItems: 'stretch',
                  justifyContent: 'center',
                }}
              >
                <MapView />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <EventLog />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, minHeight: 0 }}>
              <DivingView />
            </div>
          )}
        </div>

        <div
          style={{
            gridArea: 'right',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <RepairPanel />
        </div>

        <div style={{ gridArea: 'status' }}>
          <StatusBar />
        </div>
      </div>

      <SearchModal />
      <GameOverlay />
    </div>
  );
};

export default App;
