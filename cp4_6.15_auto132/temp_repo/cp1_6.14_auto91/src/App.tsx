import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import FosterDetail from './pages/FosterDetail';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';

const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-icon">🐾</span>
            <span>宠物寄养</span>
          </Link>

          <div className="navbar-links">
            <Link to="/" className={`navbar-link ${isActive('/') && !isActive('/dashboard') && !isActive('/messages') ? 'active' : ''}`}>
              首页
            </Link>
            <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
              日程管理
            </Link>
            <Link to="/messages" className={`navbar-link ${isActive('/messages') ? 'active' : ''}`}>
              消息
            </Link>
          </div>

          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="打开菜单"
          >
            ☰
          </button>
        </div>
      </nav>

      <div
        className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <button
          className="mobile-menu-close"
          onClick={() => setMenuOpen(false)}
          aria-label="关闭菜单"
        >
          ✕
        </button>
        <Link to="/" className={`mobile-menu-link ${isActive('/') && !isActive('/dashboard') && !isActive('/messages') ? 'active' : ''}`}>
          🏠 首页
        </Link>
        <Link to="/dashboard" className={`mobile-menu-link ${isActive('/dashboard') ? 'active' : ''}`}>
          📅 日程管理
        </Link>
        <Link to="/messages" className={`mobile-menu-link ${isActive('/messages') ? 'active' : ''}`}>
          💬 消息
        </Link>
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/foster/:id" element={<FosterDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/messages" element={<Messages />} />
      </Routes>
    </div>
  );
};

export default App;
