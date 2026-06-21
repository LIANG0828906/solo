import { Routes, Route, Link, useLocation } from 'react-router-dom';
import GameBoard from './game/GameBoard';
import StatsChart from './stats/StatsChart';

const App = () => {
  const location = useLocation();

  const navBtnStyle = (path: string) => ({
    padding: '10px 20px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    color: '#E2E8F0',
    background: location.pathname === path ? '#4FD1C5' : '#2D3748',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0F172A',
      color: '#E2E8F0',
    }}>
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        padding: '16px',
        background: '#1A202C',
        borderBottom: '1px solid #2D3748',
        flexShrink: 0,
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button style={navBtnStyle('/')} onMouseEnter={(e) => { if (location.pathname !== '/') e.currentTarget.style.background = '#4A5568'; }} onMouseLeave={(e) => { if (location.pathname !== '/') e.currentTarget.style.background = '#2D3748'; }}>
            🎮 游戏训练
          </button>
        </Link>
        <Link to="/stats" style={{ textDecoration: 'none' }}>
          <button style={navBtnStyle('/stats')} onMouseEnter={(e) => { if (location.pathname !== '/stats') e.currentTarget.style.background = '#4A5568'; }} onMouseLeave={(e) => { if (location.pathname !== '/stats') e.currentTarget.style.background = '#2D3748'; }}>
            📊 统计趋势
          </button>
        </Link>
      </nav>

      <main style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '24px',
      }}>
        <Routes>
          <Route path="/" element={<GameBoard />} />
          <Route path="/stats" element={<StatsChart />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
