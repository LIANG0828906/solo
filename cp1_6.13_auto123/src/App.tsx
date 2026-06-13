import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">🎯 HabitTracker</div>
        <nav className="nav-tabs">
          <Link to="/" className={`nav-tab ${location.pathname === '/' ? 'active' : ''}`}>
            每日打卡
          </Link>
          <Link to="/stats" className={`nav-tab ${location.pathname === '/stats' ? 'active' : ''}`}>
            统计分析
          </Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
