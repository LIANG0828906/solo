import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import CalendarView from './components/CalendarView';
import MessagePanel from './components/MessagePanel';
import PropertyManager from './components/PropertyManager';

export default function App() {
  return (
    <div className="app-container">
      <nav className="nav-bar">
        <div className="nav-brand">
          <span className="brand-icon">🏠</span>
          <span className="brand-text">民宿管家</span>
        </div>
        <div className="nav-links">
          <NavLink to="/calendar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📅</span>
            <span>日历看板</span>
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">💬</span>
            <span>消息面板</span>
          </NavLink>
          <NavLink to="/properties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🏡</span>
            <span>房源管理</span>
          </NavLink>
        </div>
        <div className="nav-date">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/messages" element={<MessagePanel />} />
          <Route path="/properties" element={<PropertyManager />} />
        </Routes>
      </main>
    </div>
  );
}
