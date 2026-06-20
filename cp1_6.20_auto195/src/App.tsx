import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import type { User } from './types';
import Home from './pages/Home';
import Plaza from './pages/Plaza';
import BoxDetail from './pages/BoxDetail';
import Wall from './pages/Wall';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);

  const loadUserFromStorage = useCallback(() => {
    const savedUser = localStorage.getItem('bookDriftUser');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('bookDriftUser');
      }
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (location.pathname !== '/') {
      setTimeout(() => setIsNavVisible(true), 100);
    } else {
      setIsNavVisible(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    setIsPageVisible(false);
    const timer = setTimeout(() => setIsPageVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('bookDriftUser');
    setUser(null);
    navigate('/');
  };

  const navLinks = [
    { path: '/plaza', label: '广场' },
    { path: '/my-boxes', label: '我的书箱' },
    { path: '/wall', label: '留言墙' },
  ];

  const showNavbar = location.pathname !== '/';

  return (
    <div style={styles.app}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        input::placeholder,
        textarea::placeholder {
          color: #c4a882;
        }
        input:focus,
        textarea:focus {
          border-color: #d4a574 !important;
        }
        button:hover {
          opacity: 0.9;
        }
        @media (max-width: 1024px) {
          .box-detail-content {
            grid-template-columns: 1fr !important;
          }
          .box-detail-content > div:last-child {
            position: static !important;
          }
        }
        @media (max-width: 768px) {
          .plaza-grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
            gap: 15px !important;
          }
          .plaza-grid > div {
            padding: 20px 15px !important;
          }
        }
        @media (max-width: 480px) {
          .plaza-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
          }
        }
        @media (max-width: 900px) {
          .masonry-grid {
            columns: 2 !important;
          }
        }
        @media (max-width: 600px) {
          .masonry-grid {
            columns: 1 !important;
          }
          .message-card {
            margin-bottom: 15px !important;
            padding: 16px !important;
          }
        }
      `}</style>
      {showNavbar && (
        <nav style={{
          ...styles.navbar,
          opacity: isNavVisible ? 1 : 0,
          transform: isNavVisible ? 'translateY(0)' : 'translateY(-100%)',
        }}>
          <div style={styles.navContainer}>
            <Link to="/plaza" style={styles.logo}>
              <span style={styles.logoIcon}>📚</span>
              <span style={styles.logoText}>图书漂流</span>
            </Link>
            
            <div style={styles.navLinks}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    ...styles.navLink,
                    color: location.pathname === link.path ? '#fff' : '#f5e6d3',
                    borderBottom: location.pathname === link.path ? '2px solid #d4a574' : '2px solid transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div style={styles.userSection}>
              {user && (
                <span style={styles.userNickname}>
                  👤 {user.nickname}
                </span>
              )}
              <button onClick={handleLogout} style={styles.logoutButton}>
                退出
              </button>
            </div>
          </div>
        </nav>
      )}
      
      <main style={{
        ...styles.main,
        opacity: isPageVisible ? 1 : 0,
        transition: 'opacity 0.4s ease-in-out',
      }}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/plaza" element={<Plaza />} />
          <Route path="/box/:id" element={<BoxDetail />} />
          <Route path="/wall" element={<Wall />} />
        </Routes>
      </main>
    </div>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#faf3e0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  } as React.CSSProperties,
  navbar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#3b2e1f',
    color: '#f5e6d3',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    zIndex: 1000,
    transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
  } as React.CSSProperties,
  navContainer: {
    maxWidth: '1200px',
    height: '100%',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: '#f5e6d3',
  } as React.CSSProperties,
  logoIcon: {
    fontSize: '24px',
  } as React.CSSProperties,
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#f5e6d3',
  } as React.CSSProperties,
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  } as React.CSSProperties,
  navLink: {
    color: '#f5e6d3',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: 500,
    padding: '8px 2px',
    transition: 'color 0.3s ease, border-color 0.3s ease',
  } as React.CSSProperties,
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  } as React.CSSProperties,
  userNickname: {
    fontSize: '14px',
    color: '#f5e6d3',
  } as React.CSSProperties,
  logoutButton: {
    padding: '6px 16px',
    fontSize: '13px',
    backgroundColor: 'transparent',
    color: '#f5e6d3',
    border: '1px solid #8b5e3c',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  main: {
    minHeight: '100vh',
  } as React.CSSProperties,
};

export default App;
