import React from 'react';
import { useAppStore } from '@/store';

const Header: React.FC = () => {
  const { isAdmin, toggleAdmin, toggleSidebar, sidebarOpen } = useAppStore();

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <button style={styles.menuBtn} onClick={toggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🎪</span>
          <span style={styles.logoText}>BazaarHub</span>
        </div>
      </div>
      
      <div style={styles.rightSection}>
        <button
          className="bounce"
          style={{
            ...styles.adminBtn,
            backgroundColor: isAdmin ? 'var(--success)' : 'var(--accent)',
          }}
          onClick={toggleAdmin}
        >
          {isAdmin ? '管理员模式' : '普通用户'}
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: '64px',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 243, 224, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(216, 67, 21, 0.2)',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  menuBtn: {
    display: 'none',
    padding: '8px',
    borderRadius: '8px',
    color: 'var(--text-primary)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--accent-dark)',
    letterSpacing: '0.5px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  adminBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 600,
    fontSize: '14px',
  },
};

export default Header;
