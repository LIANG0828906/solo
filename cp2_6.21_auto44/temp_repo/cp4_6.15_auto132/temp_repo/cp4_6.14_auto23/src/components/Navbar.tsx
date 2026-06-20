import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const Navbar = () => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.nickname?.charAt(0)?.toUpperCase() || 'U';

  return (
    <nav className="navbar">
      <NavLink to="/activities" className="nav-brand">
        <span style={{ color: 'var(--forest-700)' }}><LeafIcon /></span>
        <span>绿色星球</span>
      </NavLink>

      <div className="nav-links">
        <NavLink to="/activities" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          活动广场
        </NavLink>
        <NavLink to="/activities/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          发起活动
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          个人中心
        </NavLink>
      </div>

      <div className="nav-user">
        <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar" style={{ background: user?.avatar || 'var(--forest-500)' }}>
            {initial}
          </div>
          <span style={{ fontWeight: 600, color: 'var(--forest-900)' }}>{user?.nickname}</span>
        </NavLink>
        <button className="btn btn-ghost" onClick={handleLogout} title="退出登录" style={{ minHeight: 40, padding: '8px 12px' }}>
          <LogoutIcon />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
