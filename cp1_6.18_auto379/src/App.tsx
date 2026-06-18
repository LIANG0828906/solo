import React from 'react';
import CanvasPanel from './components/CanvasPanel';
import HistoryList from './components/HistoryList';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F0EB',
        color: '#2C3E50',
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <header
        style={{
          background: '#2C3E50',
          color: '#FFFFFF',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '1px' }}>
          手写识别
        </h1>
      </header>

      <div
        className="app-layout"
        style={{
          display: 'flex',
          gap: '0',
          padding: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <CanvasPanel />
        </div>
        <HistoryList />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .app-layout {
            flex-direction: column !important;
          }
          .app-layout > div:last-child {
            width: 100% !important;
            min-width: 0 !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.1) !important;
            padding: 16px !important;
          }
          .app-layout > div:last-child > div {
            width: auto !important;
          }
        }

        button:hover:not(:disabled) {
          filter: brightness(1.15);
        }

        button:active:not(:disabled) {
          filter: brightness(0.95);
        }
      `}</style>
    </div>
  );
};

export default App;
