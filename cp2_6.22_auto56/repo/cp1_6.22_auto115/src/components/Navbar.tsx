import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { useState, useEffect, useRef } from 'react';

const styles = {
  navbar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#2D6A4F',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    color: 'white',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'white',
    textDecoration: 'none',
    fontSize: '20px',
    fontWeight: 600,
  },
  logoText: {
    display: 'block',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: '1px solid white',
    color: 'white',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  userSection: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  userName: {
    fontSize: '14px',
  },
  dropdown: {
    position: 'absolute' as const,
    right: 0,
    top: '100%',
    marginTop: '8px',
    backgroundColor: 'white',
    color: '#333',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '8px 0',
    minWidth: '120px',
  },
  dropdownItem: {
    display: 'block',
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    color: '#333',
  },
} as const;

function Navbar() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const buttonHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    },
  };

  const dropdownItemHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = '#f5f5f5';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    },
  };

  return (
    <nav style={styles.navbar}>
      <Link to="/" style={styles.logoLink}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
        <span style={styles.logoText} className="hide-on-mobile">美食营养</span>
      </Link>

      <div style={styles.rightSection}>
        {user ? (
          <div style={styles.userSection} ref={dropdownRef}>
            <img
              src={user.avatar}
              alt={user.name}
              style={styles.avatar}
              onClick={() => setShowDropdown(!showDropdown)}
            />
            <span style={styles.userName} className="hide-on-mobile">{user.name}</span>
            {showDropdown && (
              <div style={styles.dropdown}>
                <button
                  style={styles.dropdownItem}
                  onClick={handleLogout}
                  {...dropdownItemHover}
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              to="/upload"
              style={styles.button}
              {...buttonHover}
              className="hide-on-mobile"
            >
              上传菜谱
            </Link>
            <Link
              to="/login"
              style={styles.button}
              {...buttonHover}
            >
              登录
            </Link>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
