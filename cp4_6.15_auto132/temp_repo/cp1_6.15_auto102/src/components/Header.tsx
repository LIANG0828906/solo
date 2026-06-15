import './Header.css';

interface HeaderProps {
  currentPage: 'dashboard' | 'subscription';
  onNavigate: (page: 'dashboard' | 'subscription') => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={() => onNavigate('dashboard')} data-ripple-trigger>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 4C8 4 4 10 4 16c0 6 4 12 12 12s12-6 12-12c0-6-4-12-12-12z"
              fill="url(#logoGradient)"
            />
            <path
              d="M16 10c-2.5 0-4.5 2-4.5 4.5S13.5 19 16 19s4.5-2 4.5-4.5S18.5 10 16 10zm0 7c-1.4 0-2.5-1.1-2.5-2.5S14.6 12 16 12s2.5 1.1 2.5 2.5S17.4 17 16 17z"
              fill="#FFF8EE"
            />
            <defs>
              <linearGradient id="logoGradient" x1="4" y1="4" x2="28" y2="28">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#F4D03F" />
              </linearGradient>
            </defs>
          </svg>
          <span className="logo-text">匠心手作</span>
        </div>

        <nav className="nav">
          <button
            className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
            data-ripple-trigger
          >
            仪表盘
          </button>
          <button
            className={`nav-btn ${currentPage === 'subscription' ? 'active' : ''}`}
            onClick={() => onNavigate('subscription')}
            data-ripple-trigger
          >
            订阅管理
          </button>
        </nav>

        <div className="user-info">
          <div className="user-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                fill="#5C4033"
              />
            </svg>
          </div>
          <span className="user-name">手作爱好者</span>
        </div>
      </div>
    </header>
  );
}
