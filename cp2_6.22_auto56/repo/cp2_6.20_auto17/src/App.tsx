import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AssignmentPanel } from './components/AssignmentPanel';
import { ErrorBook } from './components/ErrorBook';
import { useStore } from './store/useStore';
import './App.css';

function Navbar() {
  const { currentUser, users, setCurrentUser, notifications } = useStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleUserChange = (user: typeof users[0]) => {
    setCurrentUser(user);
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar glass-nav">
        <div className="nav-container">
          <div className="nav-left">
            <h1 className="app-title">📚 智能作业批改</h1>
            <div className="nav-links">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                作业中心
              </Link>
              <Link to="/errorbook" className={`nav-link ${location.pathname === '/errorbook' ? 'active' : ''}`}>
                错题本
              </Link>
            </div>
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>

          <div className="nav-right">
            <div className="user-dropdown">
              <button
                className="user-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <span className="user-avatar">{currentUser?.avatar}</span>
                <span className="user-name">{currentUser?.name}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {isUserMenuOpen && (
                <div className="user-menu glass-card">
                  <div className="user-menu-title">切换账号</div>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      className={`user-menu-item ${currentUser?.id === user.id ? 'active' : ''}`}
                      onClick={() => handleUserChange(user)}
                    >
                      <span className="menu-avatar">{user.avatar}</span>
                      <span className="menu-name">{user.name}</span>
                      {currentUser?.id === user.id && <span className="check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mobile-menu glass-card">
            <Link
              to="/"
              className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              作业中心
            </Link>
            <Link
              to="/errorbook"
              className={`mobile-nav-link ${location.pathname === '/errorbook' ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              错题本
            </Link>
          </div>
        )}
      </nav>

      <div className="notification-container">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`notification notification-${notif.type} ${notif.visible ? 'visible' : ''}`}
          >
            <div className="notification-bar"></div>
            <div className="notification-content">
              <span className="notification-icon">
                {notif.type === 'success' && '✅'}
                {notif.type === 'warning' && '⚠️'}
                {notif.type === 'error' && '❌'}
                {notif.type === 'info' && 'ℹ️'}
              </span>
              <span className="notification-message">{notif.message}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MainContent() {
  const { currentUser } = useStore();
  const [key, setKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setKey((k) => k + 1);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [currentUser?.id]);

  return (
    <main className={`main-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
      <Routes key={key}>
        <Route path="/" element={<AssignmentPanel userId={currentUser?.id || ''} />} />
        <Route path="/errorbook" element={<ErrorBook userId={currentUser?.id || ''} />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <MainContent />
      </div>
    </BrowserRouter>
  );
}

export default App;
