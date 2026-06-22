import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: '书架', icon: '📖' },
    { to: '/book/add', label: '添加书籍', icon: '➕' },
    { to: '/shelves', label: '书单', icon: '📚' },
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '14px 28px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(26, 26, 46, 0.7)',
        borderBottom: '1px solid var(--glass-border)',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 26,
              width: 40,
              height: 40,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--accent), #A78BFA)',
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(108, 99, 255, 0.4)',
            }}
          >
            📚
          </span>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FFFFFF, #B4AEFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            韵动书架
          </span>
        </NavLink>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 1,
            justifyContent: 'center',
          }}
          className="nav-desktop"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                padding: '10px 18px',
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                background: isActive ? 'rgba(108, 99, 255, 0.18)' : 'transparent',
                border: isActive ? '1px solid rgba(108, 99, 255, 0.3)' : '1px solid transparent',
                transition: 'all 0.25s ease',
              })}
              onMouseEnter={(e) => {
                if (!(e.currentTarget.style.background.includes('rgba(108'))) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.style.background.includes('rgba(108, 99, 255, 0.18)')) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 12px 6px 6px',
              borderRadius: 30,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--glass-border)',
              transition: 'all 0.25s ease',
            }}
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
              alt="avatar"
              style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFFFFF10' }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
              {user?.username}
            </span>
            <span
              style={{
                fontSize: 12,
                transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
              }}
            >
              ▾
            </span>
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: 180,
                padding: 8,
                background: 'rgba(22, 33, 62, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border-light)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                animation: 'slideUp 0.2s ease both',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--glass-border)',
                }}
              >
                已登录为
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 2 }}>
                  {user?.username}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  color: '#F87171',
                  borderRadius: 8,
                  textAlign: 'left',
                  marginTop: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span>🚪</span>
                <span>退出登录</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '6px 0 0 0',
          marginTop: 14,
          borderTop: '1px solid var(--glass-border)',
          paddingTop: 14,
        }}
        className="nav-mobile"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 14px',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 11,
              minWidth: 60,
            })}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default NavBar;
