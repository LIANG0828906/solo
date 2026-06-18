import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DiaryPage from './pages/DiaryPage';
import BrowsePage from './pages/BrowsePage';
import DiaryDetailPage from './pages/DiaryDetailPage';

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <nav
          style={{
            padding: '20px 20%',
            borderBottom: '1px solid #2a2a3e',
            display: 'flex',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: '20px', background: 'linear-gradient(90deg, #00E5FF, #00BFFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            声纹心情日记
          </h1>
          <Link
            to="/"
            style={{
              color: '#e0e0e0',
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'linear-gradient(90deg, #00E5FF, #00BFFF)',
            }}
          >
            记录心情
          </Link>
          <Link
            to="/browse"
            style={{
              color: '#e0e0e0',
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            浏览广场
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<DiaryPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/diary/:id" element={<DiaryDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
