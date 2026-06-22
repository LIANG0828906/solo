import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const navItems = [
    { path: '/seats', label: '座位预约' },
    { path: '/dashboard', label: '学习统计' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: '管理后台' });
  }

  if (!user) return null;

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to="/seats" style={styles.logo}>
          📚 图书馆
        </Link>

        <div className="nav-desktop" style={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navLink,
                color: location.pathname === item.path ? 'var(--accent-color)' : 'var(--primary-color)'
              }}
            >
              {item.label}
            </Link>
          ))}
          <div style={styles.userInfo}>
            <span style={styles.username}>{user.nickname}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              退出
            </button>
          </div>
        </div>

        <button
          className="nav-mobile-toggle"
          style={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.mobileNavLink,
                color: location.pathname === item.path ? 'var(--accent-color)' : 'var(--primary-color)'
              }}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div style={styles.mobileUserInfo}>
            <span style={styles.username}>{user.nickname}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              退出
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'var(--gray-bg)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navLink: {
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    transition: 'color 0.2s ease',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: '20px',
  },
  username: {
    fontSize: '14px',
    color: 'var(--primary-color)',
  },
  logoutBtn: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: 'var(--danger-color)',
    cursor: 'pointer',
    fontSize: '13px',
  },
  menuButton: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: 'var(--primary-color)',
  },
  mobileMenu: {
    display: 'none',
    padding: '10px 20px',
    backgroundColor: 'var(--gray-bg)',
    borderTop: '1px solid #E0E4E8',
  },
  mobileNavLink: {
    display: 'block',
    padding: '12px 0',
    textDecoration: 'none',
    fontSize: '15px',
    borderBottom: '1px solid #E8ECF0',
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
  },
};

export default Navbar;
