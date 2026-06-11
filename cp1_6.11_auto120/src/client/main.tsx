import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, useLocation } from 'react-router-dom';
import App from './App';
import GlobalFeedback from './components/GlobalFeedback';
import { useUIStore } from './store/uiStore';

declare global {
  interface Window {
    __uiStore?: typeof useUIStore;
    __pendingReqCount?: number;
  }
}

function RouteChangeProgress() {
  const location = useLocation();
  const beginRequest = useUIStore((s) => s.beginRequest);
  const endRequest = useUIStore((s) => s.endRequest);

  useEffect(() => {
    beginRequest();
    const timer = setTimeout(() => {
      endRequest();
    }, 200);
    return () => clearTimeout(timer);
  }, [location.pathname, beginRequest, endRequest]);

  return null;
}

window.__uiStore = useUIStore;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <RouteChangeProgress />
      <GlobalFeedback />
      <App />
    </HashRouter>
  </StrictMode>,
);
