import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from './store';

const navItems = [
  { to: '/dashboard', label: '仪表盘', icon: '📊' },
  { to: '/inbox', label: '客户咨询', icon: '💬' },
  { to: '/portfolio', label: '作品集', icon: '🖼️' },
  { to: '/projects', label: '项目看板', icon: '📋' },
];

export default function Navbar() {
  const location = useLocation();
  const unreadCount = useStore((s) => s.inquiries.filter((i) => !i.isRead).length);

  return (
    <nav className="navbar" style={styles.navbar}>
      <div className="nav-inner" style={styles.navInner}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📷</span>
          <span className="logo-text" style={styles.logoText}>Lens Studio</span>
        </div>
        <div className="nav-links" style={styles.navLinks}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-link nav-link-hover"
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ||
                (!location.pathname || location.pathname === '/') && item.to === '/dashboard'
                  ? styles.navLinkActive
                  : {}),
              })}
            >
              <span className="nav-icon" style={styles.navIcon}>{item.icon}</span>
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

const styles: Record<string, React.CSSProperties> = {
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
};
