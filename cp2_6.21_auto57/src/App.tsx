import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecordPage from './pages/RecordPage';
import CalendarPage from './pages/CalendarPage';
import AnalysisPage from './pages/AnalysisPage';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="nav-bar">
          <div className="nav-brand">
            <i className="far fa-heart" />
            <span>情绪日志</span>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">
              <i className="far fa-edit" />
              <span>记录</span>
            </a>
            <a href="/calendar" className="nav-link">
              <i className="far fa-calendar-alt" />
              <span>日历</span>
            </a>
            <a href="/analysis" className="nav-link">
              <i className="far fa-chart-bar" />
              <span>分析</span>
            </a>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RecordPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
