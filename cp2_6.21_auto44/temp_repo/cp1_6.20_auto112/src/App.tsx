import React, { useState, useEffect } from 'react';
import { DNAProvider } from './context/DNAContext';
import Scene from './components/Scene';
import ControlPanel from './components/ControlPanel';
import DetailPanel from './components/DetailPanel';
import Minimap from './components/Minimap';

const App: React.FC = () => {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <DNAProvider>
      <div className="app-root">
        <div className="canvas-container">
          <Scene />
        </div>

        <aside className={`panel panel-left ${isMobile && leftOpen ? 'open' : ''}`}>
          <ControlPanel />
        </aside>

        <aside className={`panel panel-right ${isMobile && rightOpen ? 'open' : ''}`}>
          <DetailPanel />
        </aside>

        <Minimap />

        {isMobile && (
          <>
            <button
              className="mobile-menu-toggle"
              onClick={() => setLeftOpen((v) => !v)}
              aria-label="切换控制面板"
            >
              {leftOpen ? '✕' : '☰'}
            </button>
            <button
              className="mobile-detail-toggle"
              onClick={() => setRightOpen((v) => !v)}
              aria-label="切换详情面板"
            >
              {rightOpen ? '关闭详情' : '🔬 查看详情'}
            </button>
          </>
        )}
      </div>
    </DNAProvider>
  );
};

export default App;
