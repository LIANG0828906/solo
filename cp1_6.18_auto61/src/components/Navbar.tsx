import { useState } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const navItems = [
    { id: 'home', label: '首页' },
    { id: 'gallery', label: '画廊' },
    { id: 'profile', label: '个人主页' },
  ];

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContent}>
        <div
          style={styles.logo}
          onClick={() => onNavigate('home')}
          onMouseEnter={() => setHoveredLink('logo')}
          onMouseLeave={() => setHoveredLink(null)}
        >
          <span style={styles.logoText}>声音画廊</span>
        </div>
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.navLink,
                ...(currentPage === item.id ? styles.navLinkActive : {}),
              }}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHoveredLink(item.id)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <span style={styles.navLinkText}>{item.label}</span>
              <div
                style={{
                  ...styles.navUnderline,
                  width:
                    hoveredLink === item.id || currentPage === item.id
                      ? '100%'
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    height: '60px',
    backgroundColor: '#0B0E17',
    borderBottom: '1px solid #2A2A44',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navContent: {
    maxWidth: '1200px',
    height: '100%',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    position: 'relative',
    cursor: 'pointer',
    padding: '8px 0',
  },
  navLinkText: {
    fontSize: '14px',
    color: '#FFFFFF',
    opacity: 0.85,
  },
  navLinkActive: {
    color: '#6C63FF',
  },
  navUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '2px',
    backgroundColor: '#6C63FF',
    transition: 'width 0.3s ease',
  },
};
