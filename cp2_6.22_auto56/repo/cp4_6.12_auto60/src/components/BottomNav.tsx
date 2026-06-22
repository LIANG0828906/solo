import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: '情绪记录', icon: '📅', end: true },
  { to: '/analytics', label: '数据分析', icon: '📊', end: false },
  { to: '/settings', label: '我的', icon: '⚙️', end: false }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            'nav-item' + (isActive ? ' active' : '')
          }
        >
          <span className="nav-item-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
