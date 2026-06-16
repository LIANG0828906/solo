import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '时间线', icon: '⏳', key: 'timeline' },
  { path: '/private', label: '私密胶囊', icon: '🔒', key: 'private' },
  { path: '/opened', label: '已开启回顾', icon: '✨', key: 'opened' },
];

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⏰</div>
        <span className="sidebar-logo-text">MemoryVault</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink to="/create" className="sidebar-create-btn">
        <span>＋</span>
        <span>创建胶囊</span>
      </NavLink>
    </aside>
  );
}
