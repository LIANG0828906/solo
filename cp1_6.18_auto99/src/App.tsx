import { SearchBar } from './components/SearchBar';
import { MealPanel } from './components/MealPanel';
import { CalendarBar } from './components/CalendarBar';

function App() {
  return (
    <div className="app-root">
      <div className="app-header">
        <div className="app-logo">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4ECDC4" />
                <stop offset="100%" stopColor="#FF6B35" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="none" stroke="url(#logoGrad)" strokeWidth="2" />
            <path
              d="M16 8 Q20 12 20 16 Q20 20 16 24 Q12 20 12 16 Q12 12 16 8 Z"
              fill="url(#logoGrad)"
              opacity="0.7"
            />
            <circle cx="16" cy="16" r="3" fill="#fff" />
          </svg>
          <h1 className="app-title">
            营养<span className="accent-cyan">规划</span>师
          </h1>
        </div>
        <div className="app-subtitle">科学饮食，一目了然</div>
      </div>

      <div className="app-main">
        <div className="main-left">
          <SearchBar />
        </div>
        <div className="main-right">
          <MealPanel />
        </div>
      </div>

      <div className="app-bottom">
        <CalendarBar />
      </div>

      <div className="app-bg-decor">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>
    </div>
  );
}

export default App;
