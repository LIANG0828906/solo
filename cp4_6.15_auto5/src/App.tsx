import React, { useEffect, useState } from 'react';
import { NavBar } from './ui/components/NavBar';
import { NotificationBanner } from './ui/components/NotificationBanner';
import { Dashboard } from './ui/Dashboard';
import { SettingsPage } from './ui/SettingsPage';
import { FailureHistory } from './ui/FailureHistory';
import { appStore } from './store/appStore';
import { AppState } from './engine/types';

type Route = 'dashboard' | 'settings' | 'failures';

function parseHashRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'settings' || hash === 'failures' || hash === 'dashboard') {
    return hash;
  }
  return 'dashboard';
}

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>(parseHashRoute());
  const [state, setState] = useState<AppState | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  useEffect(() => {
    appStore.startAll();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setTimeout(() => {
        appStore.requestNotificationPermission();
      }, 1500);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigate = (r: string) => {
    const target = r as Route;
    if (target === 'dashboard') {
      window.location.hash = '#/dashboard';
    } else if (target === 'settings') {
      window.location.hash = '#/settings';
    } else if (target === 'failures') {
      window.location.hash = '#/failures';
    }
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (route) {
      case 'dashboard':
        return <Dashboard key="dashboard" />;
      case 'settings':
        return <SettingsPage key="settings" />;
      case 'failures':
        return <FailureHistory key="failures" />;
      default:
        return <Dashboard key="dashboard" />;
    }
  };

  const showBanner =
    state && state.notificationPermission === 'default' && !bannerDismissed;

  return (
    <div className="app-shell">
      <NavBar currentRoute={route} onNavigate={handleNavigate} />
      {showBanner && (
        <NotificationBanner
          permission={state!.notificationPermission}
          onRequestPermission={() => {
            appStore.requestNotificationPermission();
            setBannerDismissed(true);
          }}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
      <main key={route} style={{ animation: 'fadeIn 350ms ease both' }}>
        {renderPage()}
      </main>
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span style={styles.footerText}>
            Sentinel Monitor · 轻量级服务健康监控 · 数据存储于本地浏览器
          </span>
          <span style={styles.footerVersion}>v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footer: {
    marginTop: 'auto',
    padding: '22px 28px',
    borderTop: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    fontSize: 12,
  },
  footerInner: {
    maxWidth: 1600,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  footerText: {
    opacity: 0.75,
  },
  footerVersion: {
    fontFamily: 'var(--font-mono)',
    opacity: 0.55,
    padding: '2px 8px',
    borderRadius: 5,
    background: 'rgba(168,178,209,0.06)',
    border: '1px solid var(--color-border)',
  },
};

export default App;
