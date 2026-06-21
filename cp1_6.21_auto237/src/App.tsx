import React, { lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const DetailPage = lazy(() => import('./pages/DetailPage'));

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const scrollToForm = () => {
    navigate('/');
    setTimeout(() => {
      const form = document.querySelector('.publish-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <div className="navbar-logo-icon">🎒</div>
          <span>校园失物招领</span>
        </div>
        <button className="navbar-publish-btn" onClick={scrollToForm}>
          + 发布信息
        </button>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Suspense fallback={
          <div className="loading">
            <div className="loading-spinner"></div>
            加载中...
          </div>
        }>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/item/:id" element={<DetailPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default App;
