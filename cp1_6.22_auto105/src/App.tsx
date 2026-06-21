import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SourceDetail from './pages/SourceDetail';
import Settings from './pages/Settings';
import { getSources, Source } from './api';

const App: React.FC = () => {
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, 3000);
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSources();
      setSources(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const getPageTitle = () => {
    if (location.pathname === '/') return '仪表盘';
    if (location.pathname === '/settings') return '设置';
    if (location.pathname.startsWith('/source/')) {
      const source = sources.find(s => location.pathname.includes(s.id));
      return source ? source.name : '订阅源详情';
    }
    return '';
  };

  const getBreadcrumbs = () => {
    if (location.pathname === '/') return ['仪表盘'];
    if (location.pathname === '/settings') return ['设置'];
    if (location.pathname.startsWith('/source/')) {
      return ['仪表盘', getPageTitle()];
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle();

  return (
    <>
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}

      <nav
        style={{
          width: '240px',
          backgroundColor: '#1F2937',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '0 24px 32px',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}
        >
          订阅面板
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link
            to="/"
            style={{
              padding: '12px 24px',
              color: location.pathname === '/' ? '#3B82F6' : '#D1D5DB',
              backgroundColor: location.pathname === '/' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              textDecoration: 'none',
              fontWeight: location.pathname === '/' ? 600 : 400,
              borderLeft: location.pathname === '/' ? '3px solid #3B82F6' : '3px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            仪表盘
          </Link>
          <Link
            to="/settings"
            style={{
              padding: '12px 24px',
              color: location.pathname === '/settings' ? '#3B82F6' : '#D1D5DB',
              backgroundColor: location.pathname === '/settings' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              textDecoration: 'none',
              fontWeight: location.pathname === '/settings' ? 600 : 400,
              borderLeft: location.pathname === '/settings' ? '3px solid #3B82F6' : '3px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            设置
          </Link>
        </div>
      </nav>

      <main
        style={{
          flex: 1,
          backgroundColor: '#F9FAFB',
          padding: '32px 40px',
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '0.9rem',
              color: '#6B7280',
              marginBottom: '8px',
            }}
          >
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && <span style={{ margin: '0 8px' }}>/</span>}
                {index < breadcrumbs.length - 1 ? (
                  <Link
                    to="/"
                    style={{
                      color: '#6B7280',
                      textDecoration: 'none',
                    }}
                  >
                    {crumb}
                  </Link>
                ) : (
                  crumb
                )}
              </span>
            ))}
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              color: '#111827',
              fontWeight: 700,
            }}
          >
            {pageTitle}
          </h1>
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                sources={sources}
                loading={loading}
                onSourcesChange={fetchSources}
                showError={showError}
              />
            }
          />
          <Route
            path="/source/:sourceId"
            element={
              <SourceDetail
                sources={sources}
                showError={showError}
                onSourcesChange={fetchSources}
              />
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
