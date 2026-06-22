import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RecipeDetail from './components/RecipeDetail';
import MealPlanner from './components/MealPlanner';
import './styles/global.css';

const NavBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '🏠 仪表盘', exact: true },
    { path: '/planner', label: '📅 膳食计划', exact: true },
  ];

  const isActive = (path: string, exact: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="nav-bar"
      style={{
        backgroundColor: '#fff',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="nav-title"
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#ff8f00',
          marginRight: '48px',
        }}
      >
        🍳 智能食谱
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 500,
              color: isActive(item.path, item.exact) ? '#ff8f00' : '#666',
              backgroundColor: isActive(item.path, item.exact)
                ? '#fff3e0'
                : 'transparent',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path, item.exact)) {
                e.currentTarget.style.backgroundColor = '#faf5ef';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path, item.exact)) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#faf5ef',
        }}
      >
        <NavBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/planner" element={<MealPlanner />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
