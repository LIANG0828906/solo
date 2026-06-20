import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/library', label: '词库', icon: '📚' },
    { path: '/learn', label: '学习', icon: '🎯' },
    { path: '/review', label: '复习', icon: '🔄' },
    { path: '/stats', label: '统计', icon: '📊' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/library" className="navbar-logo">
          语镜
        </Link>

        <div className="navbar-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          {user && (
            <div className="user-info">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="user-avatar"
              />
              <span className="username">{user.username}</span>
              <button className="logout-btn" onClick={logout}>
                退出
              </button>
            </div>
          )}
        </div>

        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          {user && (
            <div className="mobile-user">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="user-avatar"
              />
              <span className="username">{user.username}</span>
            </div>
          )}
          <button className="mobile-logout-btn" onClick={logout}>
            退出登录
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
