import React from 'react';
import { useFeedbackStore } from '../../modules/feedback/store/feedbackStore';

const Navbar: React.FC = () => {
  const { currentView, setCurrentView, setCurrentMeeting, mobileMenuOpen, toggleMobileMenu } =
    useFeedbackStore();

  const navItems = [
    { view: 'list' as const, label: '会议列表', icon: '📋' },
    { view: 'create' as const, label: '新建反馈', icon: '✏️' },
  ];

  const handleNavClick = (view: 'list' | 'create') => {
    setCurrentView(view);
    if (view === 'list') {
      setCurrentMeeting(null);
    }
    if (mobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  return (
    <>
      <nav style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>📊</div>
          <h1 style={styles.logoText}>会议反馈</h1>
        </div>
        <div style={styles.navItems}>
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              style={{
                ...styles.navItem,
                ...(currentView === item.view ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>
        <div style={styles.footer}>
          <p style={styles.footerText}>反馈收集系统 v1.0</p>
        </div>
      </nav>

      <button onClick={toggleMobileMenu} style={styles.hamburger}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileMenuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map((item, index) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              style={{
                ...styles.mobileNavItem,
                ...(currentView === item.view ? styles.mobileNavItemActive : {}),
                animationDelay: `${index * 50}ms`,
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: '240px',
    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    zIndex: 100,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px 32px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '16px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    fontFamily: "'Playfair Display', serif",
    margin: 0,
  },
  navItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    background: 'rgba(37, 99, 235, 0.2)',
    color: '#ffffff',
    boxShadow: 'inset 0 0 0 1px rgba(37, 99, 235, 0.3)',
  },
  navIcon: {
    fontSize: '18px',
    width: '24px',
    textAlign: 'center',
  },
  navLabel: {
    flex: 1,
  },
  footer: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'center',
  },
  hamburger: {
    display: 'none',
    position: 'fixed',
    top: '16px',
    left: '16px',
    zIndex: 200,
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    background: '#ffffff',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1e293b',
  },
  mobileMenu: {
    display: 'none',
    position: 'fixed',
    top: '76px',
    left: '16px',
    right: '16px',
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    padding: '8px',
    zIndex: 150,
  },
  mobileNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '8px',
    color: '#64748b',
    fontSize: '15px',
    fontWeight: 500,
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    animation: 'fadeIn 0.3s ease forwards',
    opacity: 0,
  },
  mobileNavItemActive: {
    background: 'rgba(37, 99, 235, 0.08)',
    color: '#2563eb',
  },
  '@media (max-width: 1024px)': {
    sidebar: {
      transform: 'translateX(-100%)',
      transition: 'transform 0.3s ease',
    },
  },
};

const mediaQuery = `
  @media (max-width: 1024px) {
    nav {
      transform: translateX(-100%) !important;
      transition: transform 0.3s ease !important;
    }
    button[style*="hamburger"] {
      display: flex !important;
    }
    div[style*="mobileMenu"] {
      display: block !important;
    }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = mediaQuery;
document.head.appendChild(styleSheet);

export default Navbar;
