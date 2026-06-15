import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import IncomePage from './pages/Income';
import Dashboard from './pages/Dashboard';
import { fetchOverviewSummary, OverviewSummary } from './utils/api';

function App() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState<OverviewSummary | null>(null);

  useEffect(() => {
    fetchOverviewSummary().then(setSummary).catch(() => undefined);
    const interval = setInterval(() => {
      fetchOverviewSummary().then(setSummary).catch(() => undefined);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const totalTrend = summary
    ? summary.prevMonthlyIncome > summary.prev2MonthlyIncome
      ? 'up'
      : summary.prevMonthlyIncome < summary.prev2MonthlyIncome
      ? 'down'
      : 'flat'
    : 'flat';

  const monthTrend = summary
    ? summary.monthlyIncome > summary.prevMonthlyIncome
      ? 'up'
      : summary.monthlyIncome < summary.prevMonthlyIncome
      ? 'down'
      : 'flat'
    : 'flat';

  const formatMoney = (n: number) =>
    '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="app-container">
      <aside className={`sidebar ${menuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="brand">财务管家</h2>
        </div>
        <div className="stat-card">
          <div className="stat-label">总收入</div>
          <div className="stat-value">{summary ? formatMoney(summary.totalIncome) : '--'}</div>
          <div className={`trend ${totalTrend}`}>
            <span className="arrow">▲</span>
            {summary ? formatMoney(Math.abs(summary.prevMonthlyIncome - summary.prev2MonthlyIncome)) : '--'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">当月收入</div>
          <div className="stat-value">{summary ? formatMoney(summary.monthlyIncome) : '--'}</div>
          <div className={`trend ${monthTrend}`}>
            <span className="arrow">▲</span>
            {summary ? formatMoney(Math.abs(summary.monthlyIncome - summary.prevMonthlyIncome)) : '--'}
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <nav className="topnav">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="菜单">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="nav-tabs">
            <Link to="/projects" className={`nav-tab ${isActive('/projects') ? 'active' : ''}`}>
              项目
            </Link>
            <Link to="/income" className={`nav-tab ${isActive('/income') ? 'active' : ''}`}>
              收入
            </Link>
            <Link to="/dashboard" className={`nav-tab ${isActive('/dashboard') ? 'active' : ''}`}>
              仪表盘
            </Link>
          </div>
        </nav>

        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>

      {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}

export default App;
