import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TutorialPage from './pages/TutorialPage';
import CommunityPage from './pages/CommunityPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('leather_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (username: string) => {
    const userData = { username };
    setUser(userData);
    localStorage.setItem('leather_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('leather_user');
  };

  return (
    <div className="app-container">
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">🧵</span>
            <span>匠心工坊</span>
          </Link>
          <div className="navbar-links">
            <Link to="/tutorial" className={`nav-link ${location.pathname === '/tutorial' ? 'active' : ''}`}>
              教程
            </Link>
            <Link to="/community" className={`nav-link ${location.pathname === '/community' ? 'active' : ''}`}>
              社区
            </Link>
            {user ? (
              <div className="user-area">
                <span className="username">你好, {user.username}</span>
                <button className="leather-btn-small" onClick={handleLogout}>
                  退出
                </button>
              </div>
            ) : (
              <Link to="/login" className="leather-btn-small">
                登录
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<TutorialPage user={user} />} />
          <Route path="/tutorial" element={<TutorialPage user={user} />} />
          <Route path="/community" element={<CommunityPage user={user} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>© 2026 匠心工坊 · 传承手工皮具之美</p>
      </footer>
    </div>
  );
}

export default App;
