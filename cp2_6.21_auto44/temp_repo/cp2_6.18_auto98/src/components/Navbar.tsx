import React from 'react';
import { NavLink } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

const Navbar: React.FC = React.memo(() => {
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    textDecoration: 'none',
    color: isActive ? '#3B82F6' : isDark ? '#D1D5DB' : '#4B5563',
    fontWeight: isActive ? 600 : 400,
    marginLeft: '24px',
    fontSize: '14px',
    transition: 'color 0.2s ease',
  });

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
        transition: 'background-color 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          CoSpace
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <NavLink to="/" style={navLinkStyle}>
          预订
        </NavLink>
        <NavLink to="/admin" style={navLinkStyle}>
          管理
        </NavLink>
        <button
          onClick={toggleTheme}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
            color: isDark ? '#FBBF24' : '#374151',
            cursor: 'pointer',
            marginLeft: '24px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.3s ease',
          }}
          aria-label="切换主题"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
