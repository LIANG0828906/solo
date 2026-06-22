import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const menuItems = [
  { path: '/rooms', label: '会议室', icon: '📅' },
  { path: '/teams', label: '团队工位', icon: '👥' },
  { path: '/events', label: '活动公告', icon: '📢' },
  { path: '/stats', label: '数据统计', icon: '📊' },
];

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <button
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        ☰
      </button>

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏢</span>
            <span className="logo-text">HubDesk</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <div className="user-details">
              <span className="user-name">管理员</span>
              <span className="user-role">空间管理</span>
            </div>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--color-bg-sidebar);
          color: var(--color-text-sidebar);
          display: flex;
          flex-direction: column;
          z-index: var(--z-sidebar);
          transition: transform var(--transition-normal);
        }

        .sidebar-header {
          padding: var(--spacing-xl) var(--spacing-lg);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .logo-icon {
          font-size: var(--font-size-2xl);
        }

        .logo-text {
          font-size: var(--font-size-xl);
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-md) 0;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-lg);
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: all var(--transition-fast);
          border-left: 3px solid transparent;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-item.active {
          background: rgba(59, 130, 246, 0.2);
          color: white;
          border-left-color: var(--color-primary);
        }

        .nav-icon {
          font-size: var(--font-size-lg);
          width: 24px;
          text-align: center;
        }

        .nav-label {
          font-size: var(--font-size-base);
          font-weight: 500;
        }

        .sidebar-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .user-avatar {
          font-size: var(--font-size-2xl);
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: var(--font-size-sm);
          font-weight: 500;
        }

        .user-role {
          font-size: var(--font-size-xs);
          color: rgba(255, 255, 255, 0.5);
        }

        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: var(--spacing-md);
          left: var(--spacing-md);
          z-index: calc(var(--z-sidebar) + 1);
          width: 40px;
          height: 40px;
          background: var(--color-bg-sidebar);
          color: white;
          border: none;
          border-radius: var(--radius-button);
          font-size: var(--font-size-xl);
          cursor: pointer;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: calc(var(--z-sidebar) - 1);
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            width: 260px;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .mobile-menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .sidebar-overlay {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
