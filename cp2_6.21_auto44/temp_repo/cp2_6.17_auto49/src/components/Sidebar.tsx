import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  nickname: string;
}

const Sidebar: React.FC<SidebarProps> = ({ nickname }) => {
  const location = useLocation();
  const firstLetter = nickname.charAt(0).toUpperCase();

  const navItems = [
    { path: '/', label: '运动记录', icon: '📊' },
    { path: '/plan', label: '训练计划', icon: '📅' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
      <span className="logo-icon">💪</span>
      <h1 className="logo-text">FitTracky</h1>
      </div>

      <nav className="sidebar-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavLink
          key={item.path}
          to={item.path}
          className={`nav-item ${isActive ? 'active' : ''}`}
          >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
          </NavLink>
        );
      })}
      </nav>

      <div className="sidebar-user">
      <div className="user-avatar">{firstLetter}</div>
      <span className="user-nickname">{nickname}</span>
      </div>
    </aside>
  );
};

export default Sidebar;
