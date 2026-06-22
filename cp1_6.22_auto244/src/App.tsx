import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, LayoutDashboard } from 'lucide-react';
import { socketService } from './SocketService';
import { ManagerPanel } from './ManagerPanel';
import { ScoreboardView } from './ScoreboardView';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Trophy size={28} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle' }} />
        社区运动会
      </div>
      <div className="navbar-links">
        <Link
          to="/"
          className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          控制台
        </Link>
        <Link
          to="/scoreboard"
          className={`navbar-link ${location.pathname === '/scoreboard' ? 'active' : ''}`}
        >
          <Trophy size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          排行榜大屏
        </Link>
      </div>
    </nav>
  );
};

const ConsolePage: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-layout">
        <button
          className="mobile-drawer-toggle"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        >
          {mobileDrawerOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
        </button>

        <ManagerPanel
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />

        <ScoreboardView fullScreen={false} />
      </div>
    </div>
  );
};

const ScoreboardPage: React.FC = () => {
  return (
    <div className="app-container">
      <Navbar />
      <ScoreboardView fullScreen={true} />
    </div>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConsolePage />} />
        <Route path="/scoreboard" element={<ScoreboardPage />} />
      </Routes>
    </Router>
  );
};

export default App;
