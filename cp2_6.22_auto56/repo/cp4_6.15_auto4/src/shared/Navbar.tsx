import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { addRipple } from './utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">二手书<span>交换</span></Link>
        </div>
        <div className="navbar-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>
            书籍列表
          </Link>
          <Link
            to="/exchange-history"
            className={isActive('/exchange-history') ? 'active' : ''}
          >
            交换记录
          </Link>
          <div className="nav-user">
            <span className="nav-user-nickname">{user?.nickname}</span>
            <button className="btn-logout" onMouseDown={handleLogout}>
              登出
            </button>
          </div>
        </div>
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          onMouseDown={addRipple}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <div className={`nav-mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className={isActive('/') ? 'active' : ''}
        >
          书籍列表
        </Link>
        <Link
          to="/exchange-history"
          onClick={() => setMenuOpen(false)}
          className={isActive('/exchange-history') ? 'active' : ''}
        >
          交换记录
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <span style={{ color: 'var(--color-mint)', fontWeight: 500 }}>{user?.nickname}</span>
          <button className="btn-logout" onMouseDown={handleLogout}>
            登出
          </button>
        </div>
      </div>
    </>
  );
}
