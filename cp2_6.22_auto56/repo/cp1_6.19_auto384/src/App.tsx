import React, { useRef, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import CanvasBoard from '@/components/CanvasBoard';
import Toolbar from '@/components/Toolbar';
import SidePanel from '@/components/SidePanel';
import useDrawingStore from '@/store/drawingStore';

const App: React.FC = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { currentSessionName, userColor, userId } = useDrawingStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <SidePanel
        socketRef={socketRef}
        isOpen={isMobilePanelOpen}
        onClose={() => setIsMobilePanelOpen(false)}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minWidth: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              backgroundColor: 'rgba(30, 30, 30, 0.9)',
              padding: '8px 14px',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              pointerEvents: 'auto',
            }}
          >
            {isMobile && (
              <button
                onClick={() => setIsMobilePanelOpen(true)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ccc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                <i className="fa-solid fa-bars" />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-palette" style={{ color: '#FF5722' }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: isMobile ? 120 : 200,
                }}
              >
                {currentSessionName || '协作涂鸦'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: 'rgba(30, 30, 30, 0.9)',
              padding: '8px 14px',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                boxShadow: '0 0 8px #4CAF50',
              }}
            />
            <span style={{ fontSize: 12, color: '#ccc' }}>在线</span>
            <div
              style={{
                width: 1,
                height: 16,
                backgroundColor: 'rgba(255,255,255,0.15)',
                margin: '0 4px',
              }}
            />
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: userColor,
                border: '2px solid white',
                boxShadow: `0 0 6px ${userColor}`,
              }}
              title={`用户ID: ${userId?.slice(0, 6)}`}
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <CanvasBoard socketRef={socketRef} />
        </div>

        <Toolbar socketRef={socketRef} />
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default App;
