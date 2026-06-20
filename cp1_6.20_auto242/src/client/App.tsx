import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import TimeSheetPage from './TimeSheetPage';
import ApprovalPage from './ApprovalPage';
import './App.css';

const App: React.FC = () => {
  const [navOpen, setNavOpen] = useState(true);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">工时管理</span>
          </div>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>工时填写</span>
          </NavLink>
          <NavLink
            to="/approval"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span>审批管理</span>
          </NavLink>
        </nav>
        <div className="top-nav">
          <NavLink to="/" end className={({ isActive }) => `top-nav-item ${isActive ? 'top-nav-item-active' : ''}`}>
            工时填写
          </NavLink>
          <NavLink to="/approval" className={({ isActive }) => `top-nav-item ${isActive ? 'top-nav-item-active' : ''}`}>
            审批管理
          </NavLink>
        </div>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<TimeSheetPage />} />
            <Route path="/approval" element={<ApprovalPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
