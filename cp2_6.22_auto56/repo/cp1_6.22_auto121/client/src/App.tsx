import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import HomeMap from './pages/HomeMap';
import StationsPage from './pages/StationsPage';
import BooksPage from './pages/BooksPage';
import BookDetail from './pages/BookDetail';
import StationDetail from './pages/StationDetail';

const App: React.FC = () => {
  const location = useLocation();

  const navStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '8px',
    color: active ? '#1565C0' : '#555',
    backgroundColor: active ? '#E3F2FD' : 'transparent',
    fontWeight: active ? 600 : 400,
    transition: 'all 0.2s ease',
    fontSize: '14px',
  });

  const isHome = location.pathname === '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header
        style={{
          backgroundColor: '#1565C0',
          color: '#fff',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>📚</span>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>社区图书漂流管理系统</h1>
        </div>
        <nav style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
          <NavLink to="/" style={({ isActive }) => navStyle(isActive || isHome)}>
            <span style={{ color: isHome ? '#1565C0' : '#fff' }}>🏠 地图概览</span>
          </NavLink>
          <NavLink to="/stations" style={({ isActive }) => navStyle(isActive)}>
            <span style={{ color: location.pathname.startsWith('/stations') && !isHome ? '#1565C0' : '#fff' }}>📍 站点管理</span>
          </NavLink>
          <NavLink to="/books" style={({ isActive }) => navStyle(isActive)}>
            <span style={{ color: location.pathname.startsWith('/books') ? '#1565C0' : '#fff' }}>📖 图书登记</span>
          </NavLink>
        </nav>
      </header>
      <main style={{ flex: 1, overflow: 'auto', backgroundColor: '#F5F5F5' }}>
        <Routes>
          <Route path="/" element={<HomeMap />} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/stations/:id" element={<StationDetail />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetail />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
