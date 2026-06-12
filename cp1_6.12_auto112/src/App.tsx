import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

const Home = lazy(() => import('./pages/Home'));
const SnippetDetail = lazy(() => import('./pages/SnippetDetail'));
const CreateSnippet = lazy(() => import('./pages/CreateSnippet'));

const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    color: 'var(--text-secondary)'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid var(--bg-secondary)',
      borderTopColor: 'var(--accent-blue)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && searchQuery) {
    }
  }, [location.pathname, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onSearch={handleSearch} searchQuery={searchQuery} />
      <main style={{ flex: 1, paddingTop: '64px' }}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home searchQuery={searchQuery} />} />
            <Route path="/snippet/:id" element={<SnippetDetail />} />
            <Route path="/create" element={<CreateSnippet />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
