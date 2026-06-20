import React, { useEffect } from 'react';
import { useStore } from './store';
import ExcavationGrid from './components/ExcavationGrid';
import ReconstructionBoard from './components/ReconstructionBoard';
import JournalPanel from './components/JournalPanel';

const App: React.FC = () => {
  const {
    initGrid,
    isMobile,
    isJournalExpanded,
    setIsMobile,
    toggleJournal,
    resetExcavation,
    viewingArtifact,
    setViewingArtifact,
  } = useStore();

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  const desktopLayout = (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: '#C2B280',
        overflow: 'hidden',
      }}
    >
      <JournalPanel isMobile={false} isExpanded={false} onToggle={() => {}} />

      <div
        style={{
          flex: 1,
          minWidth: 600,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          {viewingArtifact && (
            <button
              onClick={() => setViewingArtifact(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#8B7355',
                color: '#E8D5B7',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              退出查看
            </button>
          )}
          <button
            onClick={resetExcavation}
            style={{
              padding: '8px 16px',
              backgroundColor: '#8B7355',
              color: '#E8D5B7',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            重新挖掘
          </button>
        </div>
        <ExcavationGrid />
      </div>

      <div
        style={{
          width: 'calc(100% - 220px - 600px)',
          minWidth: 450,
          height: '100%',
          backgroundColor: 'rgba(194, 178, 128, 0.3)',
          overflow: 'auto',
        }}
      >
        <ReconstructionBoard />
      </div>
    </div>
  );

  const mobileLayout = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#C2B280',
        overflowY: 'auto',
      }}
    >
      <JournalPanel isMobile={true} isExpanded={isJournalExpanded} onToggle={toggleJournal} />

      <div
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          borderBottom: '1px solid #8B7355',
        }}
      >
        {viewingArtifact && (
          <button
            onClick={() => setViewingArtifact(null)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#8B7355',
              color: '#E8D5B7',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.15s ease',
            }}
            onTouchStart={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            退出查看
          </button>
        )}
        <button
          onClick={resetExcavation}
          style={{
            padding: '8px 16px',
            backgroundColor: '#8B7355',
            color: '#E8D5B7',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
          onTouchStart={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onTouchEnd={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          重新挖掘
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ExcavationGrid />
      </div>

      <div
        style={{
          minHeight: 550,
          backgroundColor: 'rgba(194, 178, 128, 0.3)',
          borderTop: '1px solid #8B7355',
        }}
      >
        <ReconstructionBoard />
      </div>
    </div>
  );

  return isMobile ? mobileLayout : desktopLayout;
};

export default App;
