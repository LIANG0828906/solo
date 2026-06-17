import { Routes, Route, Link, useLocation } from 'react-router-dom';
import VotePage from './pages/VotePage';
import SchedulePage from './pages/SchedulePage';

function NavBar() {
  const location = useLocation();

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: '8px',
    color: active ? '#fff' : '#9ca3af',
    background: active ? '#8b5cf6' : 'transparent',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    fontSize: 'clamp(14px, 1.5vw, 16px)',
  });

  return (
    <nav
      style={{
        padding: '16px 0',
        marginBottom: '32px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(20px, 2.5vw, 28px)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          团队日程投票
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/" style={navLinkStyle(location.pathname === '/')}>
            投票管理
          </Link>
          <Link to="/schedule" style={navLinkStyle(location.pathname.startsWith('/schedule'))}>
            智能排期
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <NavBar />
      <div className="container">
        <Routes>
          <Route path="/" element={<VotePage />} />
          <Route path="/poll/:id" element={<VotePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/schedule/:pollId" element={<SchedulePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
