import { formatDate, getDayName } from '../utils/dateUtils';

export default function Navbar() {
  const today = new Date();
  const dateStr = formatDate(today);
  const dayName = getDayName(dateStr);

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <h1 className="page-title">
            {window.location.pathname.includes('rooms') && '会议室管理'}
            {window.location.pathname.includes('teams') && '团队与工位'}
            {window.location.pathname.includes('events') && '活动公告'}
            {window.location.pathname.includes('stats') && '数据统计'}
            {window.location.pathname === '/' && '会议室管理'}
          </h1>
        </div>

        <div className="navbar-right">
          <div className="date-display">
            <span className="date-icon">📅</span>
            <span className="date-text">{dateStr}</span>
            <span className="day-text">{dayName}</span>
          </div>

          <div className="notifications">
            <button className="notification-btn">
              <span>🔔</span>
              <span className="notification-badge">3</span>
            </button>
          </div>
        </div>
      </header>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--navbar-height);
          background: var(--color-bg-navbar);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-navbar);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-xl);
          z-index: var(--z-navbar);
          transition: left var(--transition-normal);
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .page-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .date-display {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-primary);
          border-radius: var(--radius-button);
          font-size: var(--font-size-sm);
        }

        .date-icon {
          font-size: var(--font-size-base);
        }

        .date-text {
          color: var(--color-text-primary);
          font-weight: 500;
        }

        .day-text {
          color: var(--color-text-secondary);
        }

        .notifications {
          position: relative;
        }

        .notification-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border: none;
          background: var(--color-bg-primary);
          border-radius: var(--radius-button);
          font-size: var(--font-size-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .notification-btn:hover {
          background: #e5e7eb;
        }

        .notification-btn:active {
          transform: scale(0.95);
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: var(--color-danger);
          color: white;
          font-size: 11px;
          font-weight: 600;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .navbar {
            left: 0;
            padding: 0 var(--spacing-md);
            padding-left: 60px;
          }

          .page-title {
            font-size: var(--font-size-md);
          }

          .date-display {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
