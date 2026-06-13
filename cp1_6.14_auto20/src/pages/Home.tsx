import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import GameBoard from '../gameBoard';
import UnitPanel from '../unitPanel';
import CombatLog from '../combatLog';
import Toolbar from '../toolbar';

const Home: React.FC = () => {
  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="app-container">
      <Toolbar />

      <div className="main-layout">
        <div className="map-section">
          <GameBoard />
        </div>

        {isMobile && (
          <button
            className="mobile-panel-toggle"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            {panelOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            <span className="ml-2">面板</span>
          </button>
        )}

        <div className={`side-panel ${isMobile && panelOpen ? 'open' : ''}`}>
          <div className="panel-section">
            <UnitPanel />
          </div>
          <div className="panel-section">
            <CombatLog />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
