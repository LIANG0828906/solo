import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/courses', label: '课程编排', icon: '📅' },
  { to: '/learners', label: '学员管理', icon: '👥' },
  { to: '/progress', label: '学习进度', icon: '📊' },
  { to: '/analytics', label: '数据分析', icon: '📈' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">培训管理系统</h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
