import React from 'react';

interface NavBarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const NAV_ITEMS = [
  { route: 'dashboard', label: '监控看板', icon: '◉' },
  { route: 'failures', label: '故障历史', icon: '⚑' },
  { route: 'settings', label: '设置', icon: '⚙' },
];

export const NavBar: React.FC<NavBarProps> = ({ currentRoute, onNavigate }) => {
  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <div style={styles.brand} onClick={() => onNavigate('dashboard')} role="button">
          <div style={styles.logo}>
            <span style={styles.logoDot}>◉</span>
          </div>
          <div style={styles.brandText}>
            <div style={styles.brandName}>Sentinel Monitor</div>
            <div style={styles.brandTag}>服务健康监控 · 轻量级</div>
          </div>
        </div>

        <div style={styles.navItems}>
          {NAV_ITEMS.map((item) => {
            const active = currentRoute === item.route;
            return (
              <button
                key={item.route}
                onClick={() => onNavigate(item.route)}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                }}
              >
                <span style={{ opacity: active ? 1 : 0.7, fontSize: 14 }}>{item.icon}</span>
                <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {active && <span style={styles.activeIndicator} />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    backgroundColor: 'rgba(26, 26, 46, 0.82)',
    borderBottom: '1px solid var(--color-border)',
  },
  inner: {
    maxWidth: 1600,
    margin: '0 auto',
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 11,
    background:
      'linear-gradient(135deg, rgba(233,69,96,0.2) 0%, rgba(15,52,96,0.8) 100%)',
    border: '1px solid rgba(233,69,96,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    color: 'var(--color-accent-warning)',
    fontSize: 18,
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.15,
  },
  brandName: {
    color: 'var(--color-text-primary)',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  brandTag: {
    color: 'var(--color-text-muted)',
    fontSize: 11,
    marginTop: 2,
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    background: 'var(--color-bg-card)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 9,
    color: 'var(--color-text-secondary)',
    fontSize: 13,
    transition: 'all 180ms ease',
  },
  navItemActive: {
    background: 'var(--color-bg-highlight)',
    color: 'var(--color-text-primary)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 3,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 16,
    height: 2,
    borderRadius: 2,
    background: 'var(--color-accent-warning)',
  },
};

export default NavBar;
