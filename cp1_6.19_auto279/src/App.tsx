import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BattleshipAssembly from './components/BattleshipAssembly';
import PartPanel from './components/PartPanel';
import FleetMission from './components/FleetMission';
import AttributeBars from './components/AttributeBars';
import SaveFleetModal from './components/SaveFleetModal';
import { useGameStore } from './store/gameStore';

function App() {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { currentShip, saveFleet, resetCurrentShip } = useGameStore();
  const [fleetName, setFleetName] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveClick = () => {
    setShowSaveModal(true);
    setFleetName('');
  };

  const handleConfirmSave = () => {
    if (!fleetName.trim()) return;
    const result = saveFleet(fleetName.trim());
    if (!result.success) {
      setToastMessage(result.message || '保存失败');
      setTimeout(() => setToastMessage(null), 2500);
    } else {
      setShowSaveModal(false);
      resetCurrentShip();
    }
  };

  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    opacity: 0.4 + Math.random() * 0.6,
  }));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0D1117',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '20px',
          background: 'linear-gradient(90deg, #1F1A2E 0%, #2A1F3E 50%, #1F1A2E 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: '#fff',
              opacity: star.opacity,
              borderRadius: '1px',
            }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          minHeight: 0,
        }}
        className="app-main-container"
      >
        <div
          style={{
            flex: '0 0 70%',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
          }}
          className="dockyard-section"
        >
          <div style={{ padding: '20px 24px' }}>
            <AttributeBars
              firepower={currentShip.firepower}
              shield={currentShip.shield}
              speed={currentShip.speed}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BattleshipAssembly />
          </div>

          <div style={{ padding: '0 24px 24px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveClick}
              style={{
                width: '120px',
                height: '40px',
                backgroundColor: '#5B7A3E',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6B8A4E')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5B7A3E')}
            >
              保存到舰队
            </button>
            <button
              onClick={resetCurrentShip}
              style={{
                width: '100px',
                height: '40px',
                backgroundColor: '#4A4A4A',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5A5A5A')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A4A4A')}
            >
              重置
            </button>
          </div>
        </div>

        <div
          style={{
            flex: '0 0 30%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #1F2428',
            minWidth: 0,
          }}
          className="right-panel"
        >
          <div
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              overflow: 'hidden',
              borderBottom: '1px solid #1F2428',
            }}
          >
            <PartPanel />
          </div>

          <div
            style={{
              flex: '1 1 auto',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <FleetMission />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSaveModal && (
          <SaveFleetModal
            fleetName={fleetName}
            onFleetNameChange={setFleetName}
            onConfirm={handleConfirmSave}
            onCancel={() => setShowSaveModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              backgroundColor: 'rgba(231, 76, 60, 0.9)',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              zIndex: 1000,
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .app-main-container {
            flex-direction: column !important;
          }
          .dockyard-section {
            flex: '0 0 60%' !important;
          }
          .right-panel {
            flex: '0 0 40%' !important;
            flex-direction: row !important;
            border-left: none !important;
            border-top: 1px solid #1F2428;
          }
          .right-panel > div {
            flex: 1 !important;
            border-bottom: none !important;
            border-right: 1px solid #1F2428;
          }
          .right-panel > div:last-child {
            border-right: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
