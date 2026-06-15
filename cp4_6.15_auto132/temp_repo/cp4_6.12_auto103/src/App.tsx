import React, { useEffect } from 'react';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { CodeDetailPage } from './pages/CodeDetailPage';
import { FloatingActionButton } from './components/FloatingActionButton';

const Toast: React.FC = () => {
  const toast = useStore((s) => s.toast);
  if (!toast.message) return null;
  return (
    <div
      className={toast.visible ? 'toast-enter' : 'toast-exit'}
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#333',
        color: '#fff',
        padding: '10px 24px',
        borderRadius: 24,
        fontSize: 14,
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {toast.message}
    </div>
  );
};

const App: React.FC = () => {
  const fetchCodes = useStore((s) => s.fetchCodes);
  const fetchFolders = useStore((s) => s.fetchFolders);
  const detailCodeId = useStore((s) => s.detailCodeId);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);

  useEffect(() => {
    fetchCodes();
    fetchFolders();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Sidebar />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            zIndex: 99,
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          marginLeft: 0,
          transition: 'margin-left 0.25s ease',
          overflow: 'auto',
        }}
      >
        <header
          style={{
            background: 'var(--primary)',
            color: '#fff',
            padding: '0 16px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 50,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          <button
            onClick={() => useStore.getState().toggleSidebar()}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <span className="material-icons">menu</span>
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: 0.5 }}>CodeVault</h1>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              opacity: 0.7,
              background: 'rgba(255,255,255,0.15)',
              padding: '4px 10px',
              borderRadius: 12,
            }}
          >
            匿名模式
          </span>
        </header>

        {detailCodeId ? <CodeDetailPage /> : <HomePage />}
      </div>

      <FloatingActionButton />
      <Toast />
    </div>
  );
};

export default App;
