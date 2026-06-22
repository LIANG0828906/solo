import React, { useState } from 'react';
import { Menu, Wifi, WifiOff } from 'lucide-react';
import { Toolbar } from '@/components/Toolbar';
import { Canvas } from '@/components/Canvas';
import { SimulationController } from '@/components/SimulationController';
import { HistoryPanel } from '@/components/HistoryPanel';
import { useGeneStore } from '@/store/useGeneStore';

const LogoSvg: React.FC = () => (
  <svg
    className="navbar-logo"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 4C10 8 8 12 10 16C8 20 10 24 8 28"
      stroke="#00BFA5"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M24 4C22 8 24 12 22 16C24 20 22 24 24 28"
      stroke="#00BFA5"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line x1="10" y1="6" x2="22" y2="6" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="11" x2="23" y2="11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="10" y1="16" x2="22" y2="16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="21" x2="23" y2="21" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="10" y1="26" x2="22" y2="26" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const socketConnected = useGeneStore((s) => s.socketConnected);

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="菜单"
          >
            <Menu size={22} />
          </button>
          <LogoSvg />
          <h1 className="navbar-title">基因表达调控模拟器</h1>
        </div>
        <div className="navbar-right">
          <div className="connection-status">
            {socketConnected ? (
              <>
                <Wifi size={16} />
                <span>协作已连接</span>
                <span className="status-dot online" />
              </>
            ) : (
              <>
                <WifiOff size={16} />
                <span>单机模式</span>
                <span className="status-dot" />
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="main-content">
        <Toolbar />

        <div className="canvas-wrapper">
          <HistoryPanel />
          <Canvas />
          <SimulationController />
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <Toolbar />
        </div>
      )}
    </div>
  );
};

export default App;
