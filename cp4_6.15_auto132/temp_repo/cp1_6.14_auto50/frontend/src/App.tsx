import React, { createContext, useContext, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const ActivityBoard = lazy(() => import('./pages/ActivityBoard'));
const ActivityCreate = lazy(() => import('./pages/ActivityCreate'));
const ActivityDetail = lazy(() => import('./pages/ActivityDetail'));

interface AppContextType {
  sessionId: string;
  api: ReturnType<typeof axios.create>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

function getSessionId(): string {
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sessionId', id);
  }
  return id;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessionId] = useState(getSessionId);
  const api = useRef(
    axios.create({
      baseURL: '/api',
      headers: { 'X-Session-Id': sessionId },
    })
  ).current;

  return (
    <AppContext.Provider value={{ sessionId, api }}>
      {children}
    </AppContext.Provider>
  );
}

function FadeWrapper({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setVisible(false);
    const timer = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, [location.pathname]);

  return (
    <div className={visible ? 'fade-wrapper' : ''} style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms' }}>
      {children}
    </div>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <span className="gift-icon">🎁</span>
          <span>Birthday Surprise</span>
        </Link>

        <div className="navbar-search">
          <input
            type="text"
            placeholder="搜索活动..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="navbar-actions">
          <Link to="/create" className="btn btn-primary">
            ✨ 创建新活动
          </Link>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <input
          type="text"
          placeholder="搜索活动..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input"
        />
        <Link
          to="/create"
          className="btn btn-primary"
          onClick={() => setMenuOpen(false)}
        >
          ✨ 创建新活动
        </Link>
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="suspense-loading">
      <div className="loading-spinner" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Navbar />
        <div className="main-content">
          <Suspense fallback={<LoadingFallback />}>
            <FadeWrapper>
              <Routes>
                <Route path="/" element={<ActivityBoard />} />
                <Route path="/create" element={<ActivityCreate />} />
                <Route path="/activity/:id" element={<ActivityDetail />} />
              </Routes>
            </FadeWrapper>
          </Suspense>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
