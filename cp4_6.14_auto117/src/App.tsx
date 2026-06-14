import React, { memo, useCallback } from 'react';
import { DragProvider } from '@/modules/dragModule';
import { getPlacedCount, getTotalCount } from '@/modules/puzzleManager';
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
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-modal)',
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
    color: 'var(--color-text-secondary)',
    marginBottom: 32,
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-highlight)',
    color: 'var(--color-white)',
    border: 'none',
    padding: '12px 32px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 'var(--radius-btn)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
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
            e.currentTarget.style.backgroundColor = 'var(--color-highlight)';
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
  const { fragments, showSuccess, resetGame } = useGameStore();

  const placedCount = getPlacedCount(fragments);
  const totalCount = getTotalCount(fragments);

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
    backgroundColor: 'var(--color-bg)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 24px',
    backgroundColor: 'var(--color-white)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--color-text)',
  };

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  };

  const progressStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const resetBtnStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-btn-bg)',
    color: 'var(--color-white)',
    border: 'none',
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 'var(--radius-btn)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
    overflow: 'hidden',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  };

  return (
    <div style={appStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>布局碎片还原训练</h1>
        <div style={toolbarStyle}>
          <span style={progressStyle}>进度：{placedCount} / {totalCount}</span>
          <button
            style={resetBtnStyle}
            onClick={handleReset}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-btn-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-btn-bg)';
            }}
          >
            重置
          </button>
        </div>
      </header>
      <DragProvider>
        <main style={mainStyle}>
          <div style={contentStyle}>
            <FragmentPanel />
            <CanvasArea />
            <PreviewPanel />
          </div>
        </main>
      </DragProvider>
      {showSuccess && <SuccessModal onRestart={handleRestart} />}
      <style>{`
        @media (max-width: 768px) {
          .app-content {
            flex-direction: column !important;
            width: 100% !important;
            height: 100% !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

const App = memo(AppComponent);
export default App;
