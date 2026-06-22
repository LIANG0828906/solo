import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '提交报修', icon: '📝', roles: ['user', 'repairer', 'admin'] },
  { path: '/repairs', label: '工单列表', icon: '📋', roles: ['user', 'repairer', 'admin'] },
  { path: '/admin', label: '统计看板', icon: '📊', roles: ['admin'] },
];

const roleOptions = [
  { value: 'user', label: '普通用户' },
  { value: 'repairer', label: '维修人员' },
  { value: 'admin', label: '管理员' },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, setRole, repairerName } = useApp();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="app-layout">
      <button
        className={`menu-toggle ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">🔧</div>
          <h1 className="app-name">报修系统</h1>
        </div>

        <nav className="sidebar-nav">
          {filteredNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="role-selector">
            <label className="role-label">身份切换:</label>
            <select
              className="role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {repairerName && (
            <div className="user-info">
              <span className="user-label">维修员:</span>
              <span className="user-name">{repairerName}</span>
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
