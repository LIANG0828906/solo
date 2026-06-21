import { useEffect, useState } from 'react';
import { Scene } from './Scene';
import { ExplosionPanel } from './ExplosionPanel';
import '@/styles/App.css';

export function App() {
  const [isMobile, setIsMobile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="app-container">
      <div className="scene-container">
        <Scene />
      </div>

      {!isMobile ? (
        <ExplosionPanel isOpen />
      ) : (
        <>
          <button
            className="panel-toggle-btn"
            onClick={() => setPanelOpen((v) => !v)}
          >
            {panelOpen ? '收起面板' : '展开面板'}
          </button>
          <ExplosionPanel isOpen={panelOpen} />
        </>
      )}
    </div>
  );
}
