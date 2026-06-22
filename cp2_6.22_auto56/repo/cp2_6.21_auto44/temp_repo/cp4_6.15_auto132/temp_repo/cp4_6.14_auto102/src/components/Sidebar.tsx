import { NavLink } from 'react-router-dom';
import { Users, CalendarDays, BellRing, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/members', label: '成员管理', icon: Users },
  { to: '/activities', label: '活动管理', icon: CalendarDays },
  { to: '/board', label: '公告板', icon: BellRing },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Sparkles size={18} color="#ffffff" />
        </div>
        社团管理
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}
