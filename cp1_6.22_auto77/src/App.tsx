import React, { useState, useEffect } from 'react';
import { MindMapProvider } from './context/MindMapContext';
import { Canvas } from './components/Canvas';
import { NoteBoard } from './components/NoteBoard';

const AppInner: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Roboto, sans-serif",
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          <Canvas />
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 80,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4a90d9, #3182ce)',
            color: '#fff',
            border: 'none',
            fontSize: 20,
            boxShadow: '0 6px 16px rgba(74, 144, 217, 0.4)',
            cursor: 'pointer',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          📒
        </button>

        {drawerOpen && (
          <>
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 299,
                animation: 'fadeIn 0.2s',
              }}
            />
            <div
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                height: '70vh',
                background: '#fafcff',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                boxShadow: '0 -6px 24px rgba(0,0,0,0.12)',
                zIndex: 300,
                animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                onClick={() => setDrawerOpen(false)}
                style={{
                  padding: '8px 0 4px 0',
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'grab',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 4,
                    background: '#cbd5e0',
                  }}
                />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <NoteBoard />
              </div>
            </div>
          </>
        )}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Roboto, sans-serif",
      }}
    >
      <div style={{ width: '75%', height: '100%', position: 'relative' }}>
        <Canvas />
      </div>
      <div
        style={{
          width: '25%',
          height: '100%',
          borderLeft: '1px solid #e2e8f0',
          background: '#fafcff',
          overflow: 'hidden',
        }}
      >
        <NoteBoard />
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <MindMapProvider>
    <AppInner />
  </MindMapProvider>
);

export default App;
