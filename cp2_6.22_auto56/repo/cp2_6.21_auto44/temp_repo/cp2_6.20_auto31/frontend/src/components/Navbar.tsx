import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const navItems = [
  { to: '/collection', label: '收藏' },
  { to: '/profile', label: '个人资料' },
  { to: '/community', label: '社区' },
];

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeLink = navRef.current?.querySelector('.active') as HTMLElement | null;
    if (activeLink && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    if (navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = target.getBoundingClientRect();
      setIndicatorStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    const activeLink = navRef.current?.querySelector('.active') as HTMLElement | null;
    if (activeLink && navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
      });
    }
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  const handleEditProfile = () => {
    setMenuOpen(false);
    navigate('/profile/edit');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>💿</span>
          <span style={styles.logoText}>VinylHub</span>
        </Link>

        <div ref={navRef} style={styles.navLinks} onMouseLeave={handleMouseLeave}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={handleMouseEnter}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
          <div style={{ ...styles.indicator, ...indicatorStyle }} />
        </div>

        <div style={styles.userSection} ref={menuRef}>
          <button
            style={styles.userButton}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <img
              src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt="avatar"
              style={styles.avatar}
            />
            <span style={styles.username}>{user?.username || '用户'}</span>
            <span style={{ ...styles.arrow, ...(menuOpen ? styles.arrowOpen : {}) }}>▼</span>
          </button>

          {menuOpen && (
            <div style={styles.dropdown} className="animate-slideDown">
              <button style={styles.dropdownItem} onClick={handleEditProfile}>
                <span style={styles.dropdownIcon}>⚙️</span>
                编辑资料
              </button>
              <div style={styles.dropdownDivider} />
              <button style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }} onClick={handleLogout}>
                <span style={styles.dropdownIcon}>🚪</span>
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(42, 42, 78, 0.5)',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: 28,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #e94560 0%, #ff5975 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    gap: 8,
  },
  navLink: {
    padding: '8px 20px',
    fontSize: 15,
    fontWeight: 500,
    color: '#a0a0b0',
    borderRadius: 6,
    transition: 'color 0.2s ease',
    position: 'relative',
    whiteSpace: 'nowrap',
  },
  navLinkActive: {
    color: '#ffffff',
    fontWeight: 600,
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    height: 3,
    background: 'linear-gradient(90deg, #e94560, #ff5975)',
    borderRadius: 2,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'none',
  },
  userSection: {
    position: 'relative',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 12px 6px 6px',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    borderRadius: 32,
    border: '1px solid rgba(42, 42, 78, 0.8)',
    transition: 'all 0.2s ease',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #2a2a4e',
  },
  username: {
    fontSize: 14,
    fontWeight: 500,
    color: '#ffffff',
    maxWidth: 100,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  arrow: {
    fontSize: 10,
    color: '#a0a0b0',
    transition: 'transform 0.2s ease',
  },
  arrowOpen: {
    transform: 'rotate(180deg)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    minWidth: 180,
    backgroundColor: '#16213e',
    borderRadius: 12,
    border: '1px solid #2a2a4e',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    transformOrigin: 'top right',
  },
  dropdownItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: 'transparent',
    transition: 'background-color 0.15s ease',
    textAlign: 'left' as const,
  },
  dropdownItemDanger: {
    color: '#ef4444',
  },
  dropdownIcon: {
    fontSize: 16,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#2a2a4e',
    margin: '4px 0',
  },
};

export default Navbar;
