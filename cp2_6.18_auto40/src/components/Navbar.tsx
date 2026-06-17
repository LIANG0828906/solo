import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiHome, mdiAccount, mdiBell, mdiWeatherNight, mdiWeatherSunny, mdiSwapHorizontal } from '@mdi/js';
import { useStore, useUnreadCount } from '@/store/useStore';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, setDarkMode, currentUser } = useStore();
  const unreadCount = useUnreadCount();
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);

  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      setShowBadgeAnimation(true);
      const timer = setTimeout(() => setShowBadgeAnimation(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  const toggleTheme = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode, setDarkMode]);

  const navItems = [
    { path: '/', icon: mdiHome, label: '首页' },
    { path: `/profile/${currentUser.id}`, icon: mdiAccount, label: '个人中心' },
    { path: '/messages', icon: mdiBell, label: '消息中心', showBadge: true },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate('/')}>
        <Icon path={mdiSwapHorizontal} size={1} />
        SkillSwap
      </div>

      <div className="navbar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon path={item.icon} size={0.8} />
            {item.label}
            {item.showBadge && unreadCount > 0 && (
              <span
                className="bell-badge"
                style={{
                  position: 'static',
                  marginLeft: 4,
                  animation: showBadgeAnimation ? 'bounce 0.5s ease' : 'none',
                }}
                key={unreadCount}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? '切换为浅色模式' : '切换为深色模式'}>
          <Icon path={darkMode ? mdiWeatherSunny : mdiWeatherNight} size={0.8} />
        </button>
      </div>
    </nav>
  );
}
