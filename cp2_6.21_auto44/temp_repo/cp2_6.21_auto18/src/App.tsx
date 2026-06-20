import { useState, useEffect } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { ExhibitCreator } from './components/ExhibitCreator';
import { SceneViewer } from './components/SceneViewer';
import { ExhibitPanel } from './components/ExhibitPanel';
import { LightControlPanel } from './components/LightControlPanel';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isNarrow = window.innerWidth < 1024;
      setLeftCollapsed(isNarrow);
      setRightCollapsed(isNarrow);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-bar">
            <div className="loading-progress" />
          </div>
        </div>
      )}

      <TopNavbar />

      <div className="main-content">
        <div
          className={`left-panel ${leftCollapsed ? 'collapsed' : ''}`}
          onMouseEnter={() => window.innerWidth < 1024 && setLeftCollapsed(false)}
          onMouseLeave={() => window.innerWidth < 1024 && setLeftCollapsed(true)}
        >
          <ExhibitCreator collapsed={leftCollapsed} />
          <LightControlPanel collapsed={leftCollapsed} />
        </div>

        <div className="center-viewport">
          <SceneViewer />
        </div>

        <div
          className={`right-panel ${rightCollapsed ? 'collapsed' : ''}`}
          onMouseEnter={() => window.innerWidth < 1024 && setRightCollapsed(false)}
          onMouseLeave={() => window.innerWidth < 1024 && setRightCollapsed(true)}
        >
          <ExhibitPanel collapsed={rightCollapsed} />
        </div>
      </div>
    </div>
  );
}

export default App;
