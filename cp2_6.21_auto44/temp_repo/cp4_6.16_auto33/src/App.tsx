import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useSpring, animated } from '@react-spring/web';
import FleetPage from './pages/FleetPage';
import BattlePage from './pages/BattlePage';
import ResourceBar from './components/ResourceBar';
import SaveLoadModal from './components/SaveLoadModal';
import { useGameStore } from './store/gameStore';

const App: React.FC = () => {
  const location = useLocation();
  const regenerateTick = useGameStore(s => s.regenerateResourcesTick);
  const loadSaveSlots = useGameStore(s => s.loadSaveSlots);
  const currentMessage = useGameStore(s => s.currentMessage);
  const setMessage = useGameStore(s => s.setMessage);
  const [showSaveModal, setShowSaveModal] = React.useState(false);

  useEffect(() => {
    loadSaveSlots();
    const interval = setInterval(regenerateTick, 5000);
    return () => clearInterval(interval);
  }, [regenerateTick, loadSaveSlots]);

  useEffect(() => {
    if (currentMessage) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentMessage, setMessage]);

  const headerSpring = useSpring({
    from: { y: -60, opacity: 0 },
    to: { y: 0, opacity: 1 },
    config: { tension: 120, friction: 14 }
  });

  const messageSpring = useSpring({
    opacity: currentMessage ? 1 : 0,
    transform: currentMessage ? 'translateY(0)' : 'translateY(-20px)',
    config: { tension: 200, friction: 20 }
  });

  return (
    <div className="app-container">
      <animated.header style={headerSpring} className="app-header">
        <div className="header-content">
          <h1 className="game-title">
            <span className="title-star">✦</span>
            STELLAR FLEET
            <span className="title-star">✦</span>
          </h1>
          <nav className="app-nav">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              舰队管理
            </Link>
            <Link
              to="/battle"
              className={`nav-link ${location.pathname === '/battle' ? 'active' : ''}`}
            >
              战斗
            </Link>
            <button
              className="nav-link save-btn"
              onClick={() => setShowSaveModal(true)}
            >
              存档
            </button>
          </nav>
        </div>
        <ResourceBar />
      </animated.header>

      <animated.div className="toast-message" style={messageSpring}>
        {currentMessage}
      </animated.div>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<FleetPage />} />
          <Route path="/battle" element={<BattlePage />} />
        </Routes>
      </main>

      {showSaveModal && (
        <SaveLoadModal onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
};

export default App;
