import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useStore } from './store';
import PortfolioManager from './PortfolioManager';
import StatsDashboard from './StatsDashboard';
import InboxPanel from './InboxPanel';
import ProjectBoard from './ProjectBoard';

const navItems = [
  { to: '/dashboard', label: '仪表盘', icon: '📊' },
  { to: '/inbox', label: '客户咨询', icon: '💬' },
  { to: '/portfolio', label: '作品集', icon: '🖼️' },
  { to: '/projects', label: '项目看板', icon: '📋' },
];

function Navbar() {
  const location = useLocation();
  const unreadCount = useStore((s) => s.inquiries.filter((i) => !i.isRead).length);

  return (
    <nav style={styles.navbar}>
      <div style={styles.navInner}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📷</span>
          <span style={styles.logoText}>Lens Studio</span>
        </div>
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive || (!location.pathname || location.pathname === '/') && item.to === '/dashboard'
                  ? styles.navLinkActive
                  : {}),
              })}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.to === '/inbox' && unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      style={{
        ...styles.pageWrapper,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const hydrate = useStore((s) => s.hydrate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void hydrate().then(() => setHydrated(true));
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Navbar />
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<PageWrapper><StatsDashboard /></PageWrapper>} />
          <Route path="/dashboard" element={<PageWrapper><StatsDashboard /></PageWrapper>} />
          <Route path="/inbox" element={<PageWrapper><InboxPanel /></PageWrapper>} />
          <Route path="/portfolio" element={<PageWrapper><PortfolioManager /></PageWrapper>} />
          <Route path="/projects" element={<PageWrapper><ProjectBoard /></PageWrapper>} />
        </Routes>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid #3a3a5c',
    borderTop: '4px solid #4facfe',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#a0a0b8',
    fontSize: 14,
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(26, 26, 46, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(58, 58, 92, 0.5)',
  },
  navInner: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#4facfe',
    letterSpacing: 0.5,
  },
  navLinks: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 10,
    color: '#a0a0b8',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  navLinkActive: {
    background: 'rgba(79, 172, 254, 0.12)',
    color: '#4facfe',
    boxShadow: 'inset 0 0 0 1px rgba(79, 172, 254, 0.3)',
  },
  navIcon: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 6,
    background: '#ff6b6b',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
  },
  main: {
    flex: 1,
    maxWidth: 1400,
    width: '100%',
    margin: '0 auto',
    padding: '32px 28px',
  },
  pageWrapper: {
    minHeight: 'calc(100vh - 140px)',
  },
};
