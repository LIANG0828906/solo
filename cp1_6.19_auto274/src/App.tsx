import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from './components/GameBoard';
import StatusPanel from './components/StatusPanel';
import CombatOverlay from './components/CombatOverlay';
import { useGameStore } from './store';

function App() {
  const { currentLevel, initGame } = useGameStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1A0A2E',
        color: '#E0E0E0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '2px solid #C9A96E',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px', color: '#C9A96E', fontWeight: 'bold' }}>
          ⚔️ 地下城探险
        </h1>
      </header>

      <main
        style={{
          display: 'flex',
          flex: 1,
          gap: '0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: '0 0 80%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <GameBoard />
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          style={{
            width: '2px',
            backgroundColor: '#C9A96E',
            boxShadow: '0 0 10px rgba(201, 169, 110, 0.5)',
          }}
        />

        <div
          style={{
            flex: '0 0 calc(20% - 2px)',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
          }}
        >
          <StatusPanel />
        </div>
      </main>

      <CombatOverlay />

      <style>{`
        @media (max-width: 768px) {
          main {
            flex-direction: column !important;
          }
          main > div:first-child {
            flex: 1 !important;
            width: 100% !important;
            min-height: 60vh;
          }
          main > div:nth-child(2) {
            width: 100% !important;
            height: 2px !important;
          }
          main > div:last-child {
            flex: none !important;
            width: 100% !important;
            padding: 10px !important;
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        #root {
          width: 100vw;
          height: 100vh;
        }
      `}</style>
    </div>
  );
}

export default App;
