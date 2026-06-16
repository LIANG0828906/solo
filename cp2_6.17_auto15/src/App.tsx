import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PlaybackPanel from './components/PlaybackPanel';
import ExportButton from './components/ExportButton';
import { useCanvasStore } from './store/useCanvasStore';

const MOBILE_BREAKPOINT = 768;

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { isPlayback, isPlaybackPanelExpanded, setPlaybackPanelExpanded } = useCanvasStore();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) {
        setPlaybackPanelExpanded(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [setPlaybackPanelExpanded]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F5F5F5',
      }}
    >
      <Toolbar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: isMobile ? 1 : (isPlaybackPanelExpanded ? 'calc(100% - 280px)' : '100%'),
            transition: 'flex 0.3s ease',
            minWidth: 0,
          }}
        >
          <Canvas />
          <ExportButton />
        </div>

        {!isMobile && isPlaybackPanelExpanded && <PlaybackPanel />}

        {!isMobile && !isPlaybackPanelExpanded && (
          <div
            onClick={() => setPlaybackPanelExpanded(true)}
            style={{
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
              width: 20,
              height: 60,
              backgroundColor: '#FAFAFA',
              borderLeft: '1px solid #E0E0E0',
              borderTop: '1px solid #E0E0E0',
              borderBottom: '1px solid #E0E0E0',
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 40,
              fontSize: 12,
              color: '#666',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F0F0F0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FAFAFA';
            }}
          >
            ◀
          </div>
        )}

        {isPlayback && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1976D2',
              color: 'white',
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: 13,
              zIndex: 50,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)',
              pointerEvents: 'none',
            }}
          >
            回放模式 - 画布已锁定
          </div>
        )}
      </div>

      {isMobile && <PlaybackPanel isCollapsedMobile />}
    </div>
  );
};

export default App;
