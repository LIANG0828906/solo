import { useEffect, useState } from 'react';
import { useGameStore } from './store';
import GameBoard from './components/GameBoard';
import InfoPanel from './components/InfoPanel';
import GameOverModal from './components/GameOverModal';

function App() {
  const initGame = useGameStore((state) => state.initGame);
  const [isMobile, setIsMobile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="game-container">
      {isMobile && (
        <button
          className="mobile-menu-btn"
          onClick={() => setPanelOpen(!panelOpen)}
        >
          ☰
        </button>
      )}

      <div className="game-layout">
        {!isMobile && (
          <div className="info-panel-container">
            <InfoPanel />
          </div>
        )}

        {isMobile && panelOpen && (
          <div className="mobile-drawer">
            <InfoPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
          </div>
        )}

        <div className="game-board-container">
          <GameBoard />
        </div>
      </div>

      <GameOverModal />
    </div>
  );
}

export default App;
