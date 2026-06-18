import React, { useState, Suspense, lazy } from 'react';
import { FaSortAmountDown, FaCog } from 'react-icons/fa';

const SortVisualizer = lazy(() => import('./SortVisualizer'));

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1E1E2E',
        color: '#E0E0E0',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          backgroundColor: '#2A2A3E',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaSortAmountDown style={{ fontSize: '24px', color: '#3498DB' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>排序算法可视化对比工具</h1>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#E0E0E0',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3A3A5E')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <FaCog />
        </button>
      </header>

      <main style={{ flex: 1, padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '500px',
                color: '#888',
              }}
            >
              加载中...
            </div>
          }
        >
          <SortVisualizer showSettings={showSettings} onCloseSettings={() => setShowSettings(false)} />
        </Suspense>
      </main>
    </div>
  );
};

export default App;
