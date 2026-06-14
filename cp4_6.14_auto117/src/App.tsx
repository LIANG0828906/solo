import React, { memo, useCallback } from 'react';
import { DragProvider } from '@/modules/dragModule';
import { useGameStore } from '@/store/gameStore';
import FragmentPanel from '@/components/FragmentPanel';
import CanvasArea from '@/components/CanvasArea';
import PreviewPanel from '@/components/PreviewPanel';

interface SuccessModalProps {
  onRestart: () => void;
}

function SuccessModalComponent({ onRestart }: SuccessModalProps) {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fade-in 0.3s ease-out',
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: '48px 64px',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    color: '#059669',
    marginBottom: 16,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '12px 32px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-out',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={titleStyle}>完美还原！</div>
        <div style={subtitleStyle}>恭喜你完成了布局碎片还原训练</div>
        <button
          style={buttonStyle}
          onClick={onRestart}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }}
        >
          再玩一次
        </button>
      </div>
    </div>
  );
}

const SuccessModal = memo(SuccessModalComponent);
SuccessModal.displayName = 'SuccessModal';

function AppComponent() {
  const { showSuccess, resetGame, getPlacedCount, getTotalCount } = useGameStore();

  const placedCount = getPlacedCount();
  const totalCount = getTotalCount();

  const handleRestart = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleReset = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const appStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    zIndex: 10,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a',
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  };

  const progressStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#0f172a',
  };

  const resetBtnStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-out',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 0,
    overflow: 'hidden',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 1120,
    margin: '0 auto',
  };

  return (
    <div style={appStyle} className="app-container">
      <header style={headerStyle} className="app-header">
        <h1 style={titleStyle}>布局碎片还原训练</h1>
        <div style={toolbarStyle}>
          <span style={progressStyle}>
            进度：{placedCount} / {totalCount}
          </span>
          <button
            style={resetBtnStyle}
            onClick={handleReset}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b';
            }}
          >
            重置
          </button>
        </div>
      </header>
      <DragProvider>
        <main style={mainStyle} className="app-main">
          <div style={contentStyle} className="app-content">
            <FragmentPanel />
            <CanvasArea />
            <PreviewPanel />
          </div>
        </main>
      </DragProvider>
      {showSuccess && <SuccessModal onRestart={handleRestart} />}
      <style>{`
        @media (max-width: 1000px) {
          .app-content {
            max-width: 100% !important;
          }
        }
        @media (max-width: 768px) {
          .app-content {
            flex-direction: column !important;
            width: 100% !important;
            height: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .app-main {
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}

const App = memo(AppComponent);
export default App;
