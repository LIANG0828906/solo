import React, { useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, notification } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { key: '/inspection', label: '巡检录入', icon: '📋' },
    { key: '/dashboard', label: '工单看板', icon: '📊' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <div>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="topbar">
        <button
          className="hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="菜单"
        >
          ☰
        </button>
        <div style={{ fontWeight: 700, fontSize: 16 }}>巡检小助手</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>{currentUser.name}</div>
      </div>

      <div
        className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <span>🔧</span>
          <span>巡检小助手</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`sidebar-nav-item ${
                location.pathname === item.key ? 'active' : ''
              }`}
              onClick={() => handleNav(item.key)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ color: '#E2E8F0', fontWeight: 600, marginBottom: 4 }}>
            {currentUser.name}
          </div>
          <div>
            {currentUser.role === 'manager'
              ? '管理员'
              : currentUser.role === 'engineer'
              ? '工程师'
              : '巡检员'}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div key={location.pathname} className="page-fade">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
