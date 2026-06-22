import { useState, useCallback } from 'react';
import ExhibitionList from './ExhibitionList';
import ExhibitionDetail from './ExhibitionDetail';
import { ExhibitionSummary, TransportUpdate } from './types';
import { useSocket } from './useSocket';

type Route =
  | { name: 'list' }
  | { name: 'detail'; id: string };

function App() {
  const [route, setRoute] = useState<Route>({ name: 'list' });
  const [activeNav, setActiveNav] = useState<'exhibitions' | 'collection' | 'settings'>('exhibitions');
  const { recentUpdates, isConnected } = useSocket();

  const handleExhibitionClick = useCallback((id: string) => {
    setRoute({ name: 'detail', id });
  }, []);

  const handleBackToList = useCallback(() => {
    setRoute({ name: 'list' });
  }, []);

  const handleExhibitionCreated = useCallback((exhibition: ExhibitionSummary) => {
    // 列表页会自动刷新，这里不需要额外处理
  }, []);

  return (
    <div className="app-layout">
      <nav className="sidebar-nav">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M4 10h16" />
            <path d="M8 4v16" />
          </svg>
        </div>
        <div className="nav-items">
          <button
            className={`nav-item ${activeNav === 'exhibitions' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('exhibitions');
              if (route.name !== 'list') {
                setRoute({ name: 'list' });
              }
            }}
            title="展览管理"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            className={`nav-item ${activeNav === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveNav('collection')}
            title="藏品管理"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7h-9" />
              <path d="M14 17H5" />
              <circle cx="17" cy="17" r="3" />
              <circle cx="7" cy="7" r="3" />
            </svg>
          </button>
          <button
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveNav('settings')}
            title="设置"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
        <div className="sidebar-footer">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`} title={isConnected ? '已连接' : '断开连接'}>
            <span className="status-dot"></span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {route.name === 'list' && (
          <ExhibitionList
            onExhibitionClick={handleExhibitionClick}
            onExhibitionCreated={handleExhibitionCreated}
          />
        )}
        {route.name === 'detail' && (
          <ExhibitionDetail
            exhibitionId={route.id}
            onBack={handleBackToList}
            recentUpdates={recentUpdates}
          />
        )}
      </main>
    </div>
  );
}

export default App;
