import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

interface SidebarProps {
  onNavigate?: () => void;
}

const navItems = [
  {
    path: '/',
    label: '看板',
    icon: '📊',
  },
  {
    path: '/timeline',
    label: '时间轴',
    icon: '📅',
  },
  {
    path: '/create',
    label: '创建OKR',
    icon: '➕',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) setIsOpen(false);
  };

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
    if (isMobile) setIsOpen(false);
  };

  const sidebarContent = (
    <div
      style={{
        width: '240px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        color: 'var(--text-sidebar)',
      }}
    >
      <div
        style={{
          padding: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          O
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>OKR管理</div>
          <div style={{ fontSize: '11px', color: 'var(--text-sidebar-muted)', marginTop: '2px' }}>
            Team Platform
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-sidebar-muted)', padding: '8px 12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          导航
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text-sidebar)',
                background: isActive ? 'var(--accent)' : 'transparent',
                transition: 'background 0.2s, transform 0.2s',
                fontWeight: isActive ? 600 : 400,
              })}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                if (target.style.background !== 'var(--accent)') {
                  target.style.background = 'var(--bg-sidebar-hover)';
                }
                target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                const isActive = target.style.background === 'var(--accent)' || 
                  window.location.pathname === navItems.find(n => n.label === target.textContent?.trim())?.path ||
                  (window.location.pathname === '/' && item.path === '/');
                if (!isActive) {
                  target.style.background = 'transparent';
                }
                target.style.transform = 'scale(1)';
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
