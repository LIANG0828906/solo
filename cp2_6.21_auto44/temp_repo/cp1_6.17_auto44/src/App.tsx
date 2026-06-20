import React, { useState, useEffect } from 'react';
import DataPanel from '@modules/data/AppData';
import AppScene from '@modules/scene/AppScene';
import ControlPanel from '@modules/scene/ControlPanel';
import StatsPanel from '@modules/stats/AppStats';
import { useStore } from '@/store/useStore';
import './App.css';

const App: React.FC = () => {
  const statsExpanded = useStore((s) => s.statsExpanded);
  const setStatsExpanded = useStore((s) => s.setStatsExpanded);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 1280);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  if (isMobile) {
    return (
      <div className="app-container mobile">
        <div className="mobile-top-section">
          <div className="left-column">
            <DataPanel />
          </div>
        </div>

        <div className="mobile-scene-section">
          <AppScene />
        </div>

        <div className="mobile-bottom-section">
          <ControlPanel />
        </div>

        <div className="mobile-stats-section">
          <StatsPanel expanded={statsExpanded} onToggle={() => setStatsExpanded(!statsExpanded)} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="left-column">
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
            <DataPanel />
          </div>
          <StatsPanel expanded={statsExpanded} onToggle={() => setStatsExpanded(!statsExpanded)} />
        </div>
      </div>

      <div className="center-column">
        <AppScene />
      </div>

      <div className="right-column">
        <ControlPanel />
      </div>
    </div>
  );
};

export default App;
