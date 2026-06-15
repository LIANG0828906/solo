import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import EventListPage from './pages/EventListPage';
import CreateEventPage from './pages/CreateEventPage';
import EventDetailPage from './pages/EventDetailPage';
import CheckInPage from './pages/CheckInPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <div className="navbar-logo-icon">📸</div>
            <span>EventSnap</span>
          </div>
        </div>
        <div className="navbar-right">
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </nav>

      <aside className="sidebar">
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')} end>
            <span className="sidebar-icon">📊</span>
            <span>数据看板</span>
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <span className="sidebar-icon">📋</span>
            <span>活动列表</span>
          </NavLink>
          <NavLink to="/events/create" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <span className="sidebar-icon">➕</span>
            <span>创建活动</span>
          </NavLink>
          <NavLink to="/checkin" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}>
            <span className="sidebar-icon">📱</span>
            <span>扫码签到</span>
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <div key={location.pathname} className="page-transition-enter">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/events/create" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/checkin" element={<CheckInPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
