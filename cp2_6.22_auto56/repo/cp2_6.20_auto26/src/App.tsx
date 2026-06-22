import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BookOpen, HelpCircle, Home, Lightbulb } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { AskPage } from './pages/AskPage';
import { QuestionDetail } from './pages/QuestionDetail';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkBaseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    color: 'rgba(255, 255, 255, 0.9)'
  };

  const getNavLinkStyles = (path: string): React.CSSProperties => {
    const isActive = location.pathname === path;
    return {
      ...navLinkBaseStyles,
      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.85)'
    };
  };

  const navbarStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: scrolled ? 'rgba(191, 54, 12, 0.85)' : '#bf360c',
    backdropFilter: scrolled ? 'blur(12px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
    transition: 'all 0.3s ease',
    boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
    borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
  };

  return (
    <nav style={navbarStyles}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '20px',
            fontWeight: '800'
          }}
        >
          <Lightbulb size={28} style={{ color: '#ffc107' }} />
          <span>知享社区</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link to="/" style={getNavLinkStyles('/')}>
            <Home size={18} />
            首页
          </Link>
          <Link to="/ask" style={getNavLinkStyles('/ask')}>
            <HelpCircle size={18} />
            提问
          </Link>
          <Link to="/cards" style={getNavLinkStyles('/cards')}>
            <BookOpen size={18} />
            知识卡片
          </Link>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#fff8e1',
      marginTop: '64px',
      padding: '32px 24px',
      borderTop: '1px solid #ffe0b2'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center',
        color: '#8d6e63',
        fontSize: '13px',
        lineHeight: '1.8'
      }}>
        <p style={{ margin: 0, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Lightbulb size={18} style={{ color: '#ffc107' }} />
          <span style={{ fontWeight: '700', color: '#bf360c', fontSize: '15px' }}>知享社区</span>
        </p>
        <p style={{ margin: 0 }}>
          © 2024 知享社区 - 知识共享与问答平台. All rights reserved.
        </p>
        <p style={{ margin: 0, marginTop: '4px', color: '#a1887f' }}>
          让知识流动起来，让成长更加高效
        </p>
      </div>
    </footer>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fffaf0' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: '64px' }}>
        {children}
      </main>
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            borderRadius: '8px',
            fontSize: '14px'
          }
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ask" element={<AskPage />} />
          <Route path="/question/:id" element={<QuestionDetail />} />
          <Route path="/cards" element={<HomePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};
