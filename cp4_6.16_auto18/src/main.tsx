import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link
} from 'react-router-dom';
import { useMusicStore } from './store/musicStore';

const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const DiscoveryPage = lazy(() => import('./pages/DiscoveryPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));

function App() {
  const init = useMusicStore(state => state.init);
  const isInitialized = useMusicStore(state => state.isInitialized);

  useEffect(() => {
    init();
  }, [init]);

  if (!isInitialized) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在加载音乐收藏馆...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🎵</span>
              <span className="logo-text">音乐收藏馆</span>
            </Link>
            <nav className="nav">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">📚</span>
                <span>我的收藏</span>
              </NavLink>
              <NavLink
                to="/discovery"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">🔍</span>
                <span>探索发现</span>
              </NavLink>
              <NavLink
                to="/report"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">📊</span>
                <span>听歌报告</span>
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Suspense fallback={
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<CollectionPage />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/report" element={<ReportPage />} />
            </Routes>
          </Suspense>
        </main>

        <footer className="app-footer">
          <p>© 2026 音乐收藏馆 | 用心珍藏每一段旋律</p>
        </footer>
      </div>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
