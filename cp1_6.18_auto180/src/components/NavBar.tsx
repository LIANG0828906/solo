import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Leaf, Calendar, Bell } from 'lucide-react';
import { usePlantStore } from '../stores/plantStore';
import { getPendingTasks } from '../engine/reminderEngine';
import './NavBar.css';

export default function NavBar() {
  const location = useLocation();
  const tasks = usePlantStore(s => s.tasks);
  const [badgeKey, setBadgeKey] = useState(0);
  const pendingCount = getPendingTasks(tasks).length;

  useEffect(() => {
    setBadgeKey(k => k + 1);
  }, [pendingCount]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/plants', icon: Leaf, label: '植物' },
    { path: '/calendar', icon: Calendar, label: '日历' },
  ];

  if (isMobile) {
    return (
      <nav className="nav-mobile">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path} className={`nav-mobile-item ${active ? 'active' : ''}`}>
              {item.path === '/' && pendingCount > 0 ? (
                <div className="nav-badge-wrap">
                  <Icon size={22} />
                  <span key={badgeKey} className="nav-badge nav-badge-bounce">{pendingCount}</span>
                </div>
              ) : (
                <Icon size={22} />
              )}
              <span className="nav-mobile-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="nav-top">
      <div className="nav-top-inner">
        <Link to="/" className="nav-logo">
          <Leaf size={22} color="#4ECDC4" />
          <span>花园管家</span>
        </Link>
        <div className="nav-top-links">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} className={`nav-top-link ${active ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="nav-top-right">
          {pendingCount > 0 ? (
            <div className="nav-badge-wrap">
              <Bell size={20} color="#636E72" />
              <span key={badgeKey} className="nav-badge nav-badge-bounce">{pendingCount}</span>
            </div>
          ) : (
            <Bell size={20} color="#95A5A6" />
          )}
        </div>
      </div>
    </nav>
  );
}
