import React, { Suspense, lazy, useState } from 'react';
import { useTheme } from './hooks/useTheme';
import type { Station } from './types';

const Dashboard = lazy(() =>
  import('./components/Dashboard').then((module) => ({ default: module.Dashboard }))
);

const DetailPanel = lazy(() =>
  import('./components/DetailPanel').then((module) => ({ default: module.DetailPanel }))
);

function App() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">城市空气质量监测</h1>
        <div className="header-right">
          <div className="search-bar">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="搜索城市或监测站..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="切换主题"
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="dashboard">
            <div className="loading-skeleton">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        }
      >
        <Dashboard
          searchQuery={searchQuery}
          selectedStation={selectedStation}
          onSelectStation={handleSelectStation}
          onUpdateSelectedStation={setSelectedStation}
        />
        <DetailPanel
          station={selectedStation}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          theme={theme}
        />
      </Suspense>
    </div>
  );
}

export default App;
