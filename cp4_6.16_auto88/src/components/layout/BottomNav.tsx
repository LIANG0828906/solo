import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Map, Compass, Heart } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Map, label: '规划' },
    { path: '/explore', icon: Compass, label: '探索' },
    { path: '/favorites', icon: Heart, label: '收藏' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <Icon size={22} />
              <span>{item.label}</span>
              {isActive && <div className="nav-underline" />}
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
};
