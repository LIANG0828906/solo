import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import MasonryWall from './components/MasonryWall';
import Editor from './components/Editor';
import DetailPage from './components/DetailPage';
import './App.css';

function NavBar() {
  const location = useLocation();
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#fff',
      borderBottom: '1px solid #eee',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 24 }}>🎨</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>表情包工坊</span>
      </Link>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {location.pathname !== '/editor' && (
          <Link
            to="/editor"
            style={{
              textDecoration: 'none',
              background: '#ff9f43',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            ✏️ 新建
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<MasonryWall />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/meme/:id" element={<DetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
