import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Users, User, Star } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: Sparkles, label: '创建' },
    { to: '/community', icon: Users, label: '社区' },
    { to: '/profile', icon: User, label: '我的' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Star size={24} fill="#fff" />
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
