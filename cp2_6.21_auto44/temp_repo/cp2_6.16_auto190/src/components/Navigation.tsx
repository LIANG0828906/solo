import { NavLink, useLocation } from 'react-router-dom';
import './Navigation.css';

const navItems = [
  { path: '/', label: '活动列表', icon: '📅' },
  { path: '/dashboard', label: '数据面板', icon: '📊' },
];

export default function Navigation() {
  const location = useLocation();

  return (
    <>
      <nav className="nav-top">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">EventPulse</span>
          </div>
          <div className="nav-links">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-link ${isActive || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <nav className="nav-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-bottom-item ${isActive || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`
            }
          >
            <span className="nav-bottom-icon">{item.icon}</span>
            <span className="nav-bottom-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
