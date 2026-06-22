import React, { useCallback, useEffect, useState } from 'react';
import type { Route } from './types';
import { StoryboardList } from './components/StoryboardList';
import { StoryboardEditor } from './components/StoryboardEditor';
import { StoryboardViewer } from './components/StoryboardViewer';

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (!h) return { name: 'list' };
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'editor' && parts[1]) return { name: 'editor', id: decodeURIComponent(parts[1]) };
  if (parts[0] === 'viewer' && parts[1]) return { name: 'viewer', id: decodeURIComponent(parts[1]) };
  return { name: 'list' };
}

function setHash(r: Route) {
  let target = '#/';
  if (r.name === 'editor') target = `#/editor/${encodeURIComponent(r.id)}`;
  if (r.name === 'viewer') target = `#/viewer/${encodeURIComponent(r.id)}`;
  if (window.location.hash !== target) window.location.hash = target;
}

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>(parseHash());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const navigate = useCallback((r: Route) => {
    setHash(r);
    setRoute(r);
  }, []);

  return (
    <div className="app">
      {route.name === 'list' && (
        <StoryboardList onNavigate={navigate} notify={notify} />
      )}
      {route.name === 'editor' && (
        <StoryboardEditor id={route.id} onNavigate={navigate} notify={notify} />
      )}
      {route.name === 'viewer' && (
        <StoryboardViewer id={route.id} onNavigate={navigate} notify={notify} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default App;
