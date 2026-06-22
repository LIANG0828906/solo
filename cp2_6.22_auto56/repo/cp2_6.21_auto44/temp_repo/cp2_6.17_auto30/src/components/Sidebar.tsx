import { NavLink } from 'react-router-dom';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">🌵</span>
        <span className="sidebar-title">多肉花园</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/plants" className="sidebar-link">
          <span className="sidebar-icon">🌿</span>
          <span>我的植物</span>
        </NavLink>
        <NavLink to="/reminders" className="sidebar-link">
          <span className="sidebar-icon">🔔</span>
          <span>养护提醒</span>
        </NavLink>
        <NavLink to="/species" className="sidebar-link">
          <span className="sidebar-icon">📚</span>
          <span>品种百科</span>
        </NavLink>
      </nav>
    </aside>
  );
}
