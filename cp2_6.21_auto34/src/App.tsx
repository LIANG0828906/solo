import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { ArmillarySphere } from './components/ArmillarySphere';
import { AstroDisk } from './components/AstroDisk';
import { InfoPanel } from './components/InfoPanel';
import { ControlBar } from './components/ControlBar';
import './App.css';

function AppContent() {
  const { mode, setMode, mix, setMix, isEclipsing } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    const pathMode = location.pathname === '/astrodisk' ? 'astrodisk' : 'armillary';
    setMode(pathMode);
    if (pathMode === 'armillary' && mix < 0.9) {
      setMix(1);
    } else if (pathMode === 'astrodisk' && mix > 0.1) {
      setMix(0);
    }
  }, [location.pathname]);

  const isMixed = mix > 0 && mix < 1;
  const bgColor = isMixed
    ? 'rgba(0, 0, 50, 0.6)'
    : isEclipsing
    ? 'linear-gradient(180deg, #000033 0%, #000000 100%)'
    : 'linear-gradient(180deg, #2c1810 0%, #0a0a0a 100%)';

  const handleNavClick = (targetMode: 'armillary' | 'astrodisk') => {
    setMode(targetMode);
    setMix(targetMode === 'armillary' ? 1 : 0);
  };

  return (
    <div className="app-container">
      <div className="top-decoration" />

      <header className="header">
        <h1 className="title">天文双仪</h1>

        <nav className="nav-tabs">
          <NavLink
            to="/armillary"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => handleNavClick('armillary')}
          >
            浑天仪
          </NavLink>
          <NavLink
            to="/astrodisk"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => handleNavClick('astrodisk')}
          >
            星盘
          </NavLink>
        </nav>
      </header>

      <main
        className="main-area"
        style={{
          background: bgColor,
        }}
      >
        <div className="scene-container">
          {mix > 0 && <ArmillarySphere />}
          {mix < 1 && <AstroDisk />}
        </div>
      </main>

      <ControlBar />
      <InfoPanel />

      <div className="ground-shadow" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/armillary" replace />} />
        <Route path="/armillary" element={<AppContent />} />
        <Route path="/astrodisk" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
