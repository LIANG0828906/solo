import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PlaybackPanel from './components/PlaybackPanel';
import ExportButton from './components/ExportButton';
import { useCanvasStore } from './store/useCanvasStore';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { isPlayback } = useCanvasStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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
        <Canvas />
        <ExportButton />

        {!isMobile && <PlaybackPanel />}

        {isPlayback && (
          <div
            style={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1976D2',
              color: 'white',
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: 13,
              zIndex: 50,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)',
            }}
          >
            回放模式 - 画布已锁定
          </div>
        )}
      </div>

      {isMobile && <PlaybackPanel isMobile />}
    </div>
  );
};

export default App;
