import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProjectList from '@/pages/ProjectList';
import ProjectDetail from '@/pages/ProjectDetail';
import TermBase from '@/pages/TermBase';

function NavBar() {
  const location = useLocation();
  const navItemStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: 'var(--radius)',
    backgroundColor: active ? 'var(--accent-secondary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: active ? 600 : 400,
    display: 'inline-block',
  });

  return (
    <nav
      style={{
        padding: '16px 32px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '16px',
          }}
        >
          T
        </div>
        <span style={{ fontSize: '18px', fontWeight: 600 }}>翻译记忆平台</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Link to="/" style={navItemStyle(location.pathname === '/')}>
          项目列表
        </Link>
        <Link to="/terms" style={navItemStyle(location.pathname.startsWith('/terms'))}>
          术语库
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <main style={{ flex: 1, padding: '24px 32px' }}>
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/terms" element={<TermBase />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
