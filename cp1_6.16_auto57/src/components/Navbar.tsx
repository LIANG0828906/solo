import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, RefreshCw, History, Home, Bell } from 'lucide-react';
import { database } from '../db/database';
import { getInitials } from '../utils/colors';

export function Navbar() {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const currentUser = database.getCurrentUser();

  useEffect(() => {
    const updateCount = () => {
      setPendingCount(database.getPendingRequestsCount(currentUser.id));
    };
    updateCount();
    return database.subscribe(updateCount);
  }, [currentUser.id]);

  const navItems = [
    { path: '/', icon: Home, label: '我的书架' },
    { path: '/swap', icon: RefreshCw, label: '交换管理', badge: pendingCount },
    { path: '/history', icon: History, label: '交换历史' },
    { path: '/community', icon: BookOpen, label: '社区动态' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <BookOpen size={28} className="navbar-logo-icon" />
          <span className="navbar-logo-text">书换社区</span>
        </div>

        <div className="navbar-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `navbar-link ${isActive || location.pathname === item.path ? 'active' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="navbar-badge">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="navbar-user">
          <div
            className="navbar-avatar"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {getInitials(currentUser.username)}
          </div>
          <span className="navbar-username">{currentUser.username}</span>
        </div>
      </div>
    </nav>
  );
}
