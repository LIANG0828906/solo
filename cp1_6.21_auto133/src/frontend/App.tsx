import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import FlashcardList from './FlashcardList';
import FlashcardForm from './FlashcardForm';
import ReviewSession from './ReviewSession';

const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/cards' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <div style={styles.appName}>闪卡学习</div>
        <div style={styles.navLinks}>
          <Link 
            to="/cards" 
            style={{
              ...styles.navLink,
              color: isActive('/cards') ? '#FFFFFF' : '#94A3B8'
            }}
          >
            全部卡片
          </Link>
          <Link 
            to="/cards/new" 
            style={{
              ...styles.navLink,
              color: isActive('/cards/new') ? '#FFFFFF' : '#94A3B8'
            }}
          >
            创建卡片
          </Link>
          <Link 
            to="/review" 
            style={{
              ...styles.navLink,
              color: isActive('/review') ? '#FFFFFF' : '#94A3B8'
            }}
          >
            开始复习
          </Link>
        </div>
      </div>
    </nav>
  );
};

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setShow(false);
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div style={{
      ...styles.pageTransition,
      opacity: show ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out'
    }}>
      {children}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div style={styles.appContainer}>
        <Navbar />
        <main style={styles.mainContent}>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Navigate to="/cards" replace />} />
              <Route path="/cards" element={<FlashcardList />} />
              <Route path="/cards/new" element={<FlashcardForm />} />
              <Route path="/cards/:id/edit" element={<FlashcardForm />} />
              <Route path="/review" element={<ReviewSession />} />
            </Routes>
          </PageTransition>
        </main>
      </div>
    </Router>
  );
};

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  } as React.CSSProperties,
  
  navbar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#1E293B',
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  } as React.CSSProperties,
  
  navContainer: {
    maxWidth: '1200px',
    height: '100%',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  } as React.CSSProperties,
  
  appName: {
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: 700
  } as React.CSSProperties,
  
  navLinks: {
    display: 'flex',
    gap: '20px'
  } as React.CSSProperties,
  
  navLink: {
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#FFFFFF'
    }
  } as React.CSSProperties,
  
  mainContent: {
    paddingTop: '60px',
    minHeight: 'calc(100vh - 60px)'
  } as React.CSSProperties,
  
  pageTransition: {
    minHeight: '100%'
  } as React.CSSProperties
};

export default App;
