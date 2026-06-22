import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import CommunityPage from '@/pages/CommunityPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="sidebar">
          <div className="logo">🐾 宠物乐园</div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="icon">🏠</span> 我的宠物
          </NavLink>
          <NavLink
            to="/community"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="icon">🏘️</span> 社区广场
          </NavLink>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/community" element={<CommunityPage />} />
          </Routes>
        </main>
        <nav className="bottom-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="icon">🏠</span>
            <span>我的宠物</span>
          </NavLink>
          <NavLink
            to="/community"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="icon">🏘️</span>
            <span>社区</span>
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
