import React, { useCallback } from 'react';
import ColorBar from './components/ColorBar';
import MoodSnapshot from './components/MoodSnapshot';
import DiaryList from './components/DiaryList';
import { useStore } from './store';

const App: React.FC = () => {
  const panelOpen = useStore((s) => s.panelOpen);
  const closePanel = useStore((s) => s.closePanel);

  const handleOverlayClick = useCallback(() => {
    closePanel();
  }, [closePanel]);

  return (
    <div className="app-root">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">情绪色彩谱</h1>
          <p className="app-subtitle">记录一周心情，映射属于你的色彩</p>
          <div className="header-divider" />
        </header>

        <section className="app-content">
          <div className="colorbar-area">
            <ColorBar />
          </div>

          <div className="panel-area">
            {panelOpen && <div className="panel-overlay" onClick={handleOverlayClick} />}
            <MoodSnapshot />
            <DiaryList />
          </div>
        </section>
      </div>

      <style>{`
        .app-root {
          min-height: 100vh;
          background: #13131A;
          color: #E0E0E0;
        }
        .app-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 40px;
        }
        .app-header {
          margin-bottom: 40px;
        }
        .app-title {
          font-size: 1.8rem;
          font-weight: 300;
          color: #FFF;
          letter-spacing: 2px;
        }
        .app-subtitle {
          font-size: 0.9rem;
          color: #888;
          margin-top: 8px;
        }
        .header-divider {
          width: 60px;
          height: 1px;
          background: rgba(255,255,255,0.15);
          margin-top: 16px;
        }
        .app-content {
          display: flex;
          flex-direction: column;
        }
        .colorbar-area {
          width: 100%;
        }
        .panel-area {
          display: flex;
          gap: 20px;
          position: relative;
        }
        .panel-overlay {
          display: none;
        }
        @media (max-width: 768px) {
          .app-container {
            padding: 40px 16px 24px;
          }
          .app-title {
            font-size: 1.4rem;
          }
          .colorbar-area {
            overflow-x: auto;
          }
          .panel-area {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
