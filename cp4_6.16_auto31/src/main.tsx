import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { useHabitStore } from './store';
import HabitsPanel from './modules/habits/HabitsPanel';
import TimelinePage from './modules/timeline/TimelinePage';
import './styles/global.css';

const App: React.FC = () => {
  const loadFromStorage = useHabitStore((state) => state.loadFromStorage);
  const habits = useHabitStore((state) => state.habits);
  const checkins = useHabitStore((state) => state.checkins);
  const location = useLocation();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayCheckins = checkins[today] || [];
  const totalHabits = habits.length;
  const completedHabits = todayCheckins.length;
  const progressPercent = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string => {
    return isActive
      ? 'nav-link nav-link-active'
      : 'nav-link';
  };

  return (
    <div className="app-container">
      <header className="app-header glass">
        <div className="header-content">
          <div className="app-title">
            <span className="app-logo">✨</span>
            <h1>微习惯养成</h1>
          </div>
          <nav className="app-nav">
            <NavLink to="/" className={getNavLinkClass}>
              习惯面板
            </NavLink>
            <NavLink to="/timeline" className={getNavLinkClass}>
              时间线
            </NavLink>
          </nav>
        </div>
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-label">今日进度</span>
            <span className="progress-value">{completedHabits}/{totalHabits}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes location={location}>
          <Route path="/" element={<HabitsPanel />} />
          <Route path="/timeline" element={<TimelinePage />} />
        </Routes>
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 16px 24px;
          border-radius: 0;
          border-left: none;
          border-right: none;
          border-top: none;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .app-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .app-logo {
          font-size: 28px;
        }

        .app-title h1 {
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(135deg, #e94560, #0f3460);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .app-nav {
          display: flex;
          gap: 8px;
        }

        .nav-link {
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: all var(--transition-normal);
        }

        .nav-link:hover {
          color: var(--color-text);
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(0);
        }

        .nav-link-active {
          color: var(--color-text);
          background: rgba(233, 69, 96, 0.2);
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-label {
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .progress-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
        }

        .app-main {
          flex: 1;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 12px 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 12px;
            margin-bottom: 12px;
          }

          .app-title h1 {
            font-size: 18px;
          }

          .app-main {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
