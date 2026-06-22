import React, { useCallback } from 'react';
import ExhibitionPage from './modules/exhibition/ExhibitionPage';
import RoutePanel from './modules/route/RoutePanel';

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const initialId = parseInt(params.get('exhibition') || '1', 10);
  const [currentId, setCurrentId] = React.useState(initialId);

  const handleNavigate = useCallback((id: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('exhibition', String(id));
    window.history.pushState({}, '', url.toString());
    setCurrentId(id);
  }, []);

  React.useEffect(() => {
    const onPopState = () => {
      const p = new URLSearchParams(window.location.search);
      const id = parseInt(p.get('exhibition') || '1', 10);
      setCurrentId(id);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.mainLayout}>
        <div style={styles.exhibitionArea} className="exhibition-area">
          <ExhibitionPage exhibitionId={currentId} />
        </div>
        <div style={styles.routeArea} className="route-panel-desktop">
          <RoutePanel currentId={currentId} onNavigate={handleNavigate} variant="desktop" />
        </div>
      </div>
      <div className="route-panel-mobile">
        <RoutePanel currentId={currentId} onNavigate={handleNavigate} variant="mobile" />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0F172A',
  },
  mainLayout: {
    display: 'flex',
    minHeight: '100vh',
  },
  exhibitionArea: {
    flex: '2',
    minWidth: 0,
  },
  routeArea: {
    flex: '1',
    minWidth: 0,
    borderLeft: '1px solid #1E293B',
  },
};

export default App;
