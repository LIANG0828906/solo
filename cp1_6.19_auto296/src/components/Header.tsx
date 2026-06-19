import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';

interface HeaderProps {
  title: string;
  user?: User;
  onMenuToggle: () => void;
  onViewWeeklyReport: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  user,
  onMenuToggle,
  onViewWeeklyReport,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const avatarColor = user?.avatarColor || '#7C3AED';

  return (
    <header
      style={{
        height: '64px',
        background: '#2D2D44',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '16px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <motion.button
        whileHover={{ background: 'rgba(255, 255, 255, 0.08)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onMenuToggle}
        style={{
          width: '40px',
          height: '40px',
          background: 'transparent',
          border: 'none',
          borderRadius: '10px',
          color: '#E0E0E0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </motion.button>

      <h1
        style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: '#E0E0E0',
          flex: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </h1>

      <div ref={menuRef} style={{ position: 'relative' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: avatarColor,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 600,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {initials}
        </motion.button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, type: 'spring', damping: 25 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '200px',
                background: '#2D2D44',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
              }}
            >
              {user && (
                <div
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#E0E0E0',
                      marginBottom: '2px',
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#9B9BC7',
                    }}
                  >
                    {user.role === 'admin' ? '管理员' : '团队成员'}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onViewWeeklyReport();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#E0E0E0',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                我的周报
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#EF4444',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                退出登录
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ width: '40px', flexShrink: 0 }} />
    </header>
  );
};

export default Header;
