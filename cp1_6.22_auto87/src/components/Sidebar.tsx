import { NavLink } from 'react-router-dom';
import { Home, FolderKanban, BarChart3, Settings } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/projects', icon: FolderKanban, label: '项目' },
  { path: '/analysis', icon: BarChart3, label: '分析' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <span>学</span>
        </div>
        <span className="logo-text">学习计划</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            <span className="nav-indicator" />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
