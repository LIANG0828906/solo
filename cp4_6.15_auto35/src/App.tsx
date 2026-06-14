import { useState, useCallback, useEffect } from 'react';
import WineList from './WineList';
import WineDetail from './WineDetail';
import { WineSvg } from './icons';

type Route =
  | { type: 'list' }
  | { type: 'detail'; wineId: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ type: 'list' });
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddWine = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleCloseAdd = useCallback(() => {
    setShowAddModal(false);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/wine/')) {
        const id = hash.replace('#/wine/', '');
        setRoute({ type: 'detail', wineId: id });
      } else {
        setRoute({ type: 'list' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    if (window.location.hash) {
      handlePopState();
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateHash = (newRoute: Route) => {
    const newHash = newRoute.type === 'detail'
      ? `#/wine/${newRoute.wineId}`
      : '#';
    if (window.location.hash !== newHash) {
      history.pushState(null, '', newHash);
    }
  };

  const goToList = () => {
    setRoute({ type: 'list' });
    updateHash({ type: 'list' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToDetail = (id: string) => {
    setRoute({ type: 'detail', wineId: id });
    updateHash({ type: 'detail', wineId: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo" style={{ cursor: 'pointer' }} onClick={goToList}>
            <WineSvg size={28} />
            <h1>MyWineCellar</h1>
          </div>
          {route.type === 'list' && (
            <button className="btn-primary" onClick={handleAddWine}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加藏酒
            </button>
          )}
        </div>
      </header>

      <main className="app-container">
        {route.type === 'list' ? (
          <WineList
            onSelectWine={goToDetail}
            onAddWine={handleAddWine}
            showAddModal={showAddModal}
            onCloseAdd={handleCloseAdd}
          />
        ) : (
          <WineDetail wineId={route.wineId} onBack={goToList} />
        )}
      </main>
    </div>
  );
}
