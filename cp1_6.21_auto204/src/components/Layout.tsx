import { useState, ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isBigScreen = location.pathname.includes('/attendance/display');

  if (isBigScreen) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <div className="mobile-header">
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div style={{ fontWeight: 600, fontSize: 16 }}>活动签到系统</div>
        <div style={{ width: 40 }} />
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <button className="close-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <NavLink
            to="/activity"
            className="menu-item"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            活动管理
          </NavLink>
          <NavLink
            to="/attendance"
            className="menu-item"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </span>
            签到统计
          </NavLink>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">ES</div>
          <h1>活动签到系统</h1>
        </div>
        <nav>
          <NavLink to="/activity" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </span>
            活动管理
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </span>
            签到统计
          </NavLink>
        </nav>
      </aside>

      <main className="content-area">{children}</main>

      <aside className="right-panel">
        <div style={{ padding: '0 8px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
            快捷操作
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NavLink to="/activity" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ width: '100%', textAlign: 'left' }}>
                📋 活动列表
              </button>
            </NavLink>
            <NavLink to="/attendance" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ width: '100%', textAlign: 'left' }}>
                📱 开始签到
              </button>
            </NavLink>
            <NavLink to="/attendance/display" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary" style={{ width: '100%', textAlign: 'left' }}>
                🖥️ 签到大屏
              </button>
            </NavLink>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Layout;
