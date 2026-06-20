import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/products', label: '商品管理', icon: '📦' },
  { path: '/orders', label: '订单处理', icon: '📋' },
  { path: '/delivery', label: '配送追踪', icon: '🚚' },
];

export const Header: React.FC = () => {
  const location = useLocation();

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <span className="logo-icon">🥬</span>
          <h1 className="logo-text">社区团购管理</h1>
        </div>
        <nav className="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <style>{`
        .app-header {
          background-color: var(--color-surface);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          font-size: 28px;
        }
        .logo-text {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-primary);
          margin: 0;
        }
        .nav-menu {
          display: flex;
          gap: 4px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--color-text-light);
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition-normal) ease;
          min-height: 40px;
        }
        .nav-link:hover {
          background-color: var(--color-background);
          color: var(--color-text);
        }
        .nav-link.active {
          background-color: var(--color-primary);
          color: white;
        }
        .nav-icon {
          font-size: 16px;
        }
        @media (max-width: 768px) {
          .header-container {
            padding: 0 16px;
            flex-direction: column;
            height: auto;
            gap: 12px;
            padding-top: 12px;
            padding-bottom: 12px;
          }
          .nav-menu {
            width: 100%;
            justify-content: space-around;
          }
          .nav-link {
            flex-direction: column;
            gap: 4px;
            padding: 8px 12px;
            font-size: 12px;
          }
          .nav-icon {
            font-size: 20px;
          }
          .nav-label {
            font-size: 11px;
          }
        }
      `}</style>
    </header>
  );
};
