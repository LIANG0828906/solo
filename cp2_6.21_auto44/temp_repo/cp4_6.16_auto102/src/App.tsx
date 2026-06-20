import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useWardrobeStore } from './store';
import Wardrobe from './pages/Wardrobe';
import MixAndMatch from './pages/MixAndMatch';
import DailyLog from './pages/DailyLog';
import SocialWall from './pages/SocialWall';

const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  padding: '8px 20px',
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: isActive ? 700 : 400,
  color: isActive ? '#5C3A21' : '#8D6E63',
  borderBottom: isActive ? '2px solid #5C3A21' : '2px solid transparent',
  transition: 'all 0.2s ease',
});

export default function App() {
  const loadFromDB = useWardrobeStore((s) => s.loadFromDB);

  useEffect(() => {
    loadFromDB();
  }, [loadFromDB]);

  return (
    <BrowserRouter>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(92,58,33,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '0 24px',
          height: 56,
        }}
      >
        <NavLink to="/" style={navLinkStyle} end>
          衣橱
        </NavLink>
        <NavLink to="/mix" style={navLinkStyle}>
          搭配
        </NavLink>
        <NavLink to="/log" style={navLinkStyle}>
          记录
        </NavLink>
        <NavLink to="/social" style={navLinkStyle}>
          社交墙
        </NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Wardrobe />} />
        <Route path="/mix" element={<MixAndMatch />} />
        <Route path="/log" element={<DailyLog />} />
        <Route path="/social" element={<SocialWall />} />
      </Routes>
    </BrowserRouter>
  );
}
