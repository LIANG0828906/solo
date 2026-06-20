import React, { useRef, useState, useEffect } from 'react';
import { PartPanel } from './components/PartPanel';
import { Workspace } from './components/Workspace';
import { OrderPanel } from './components/OrderPanel';
import { Toolbar } from './components/Toolbar';

const App: React.FC = () => {
  const snapshotRef = useRef<((nickname: string) => void) | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showPartsDrawer, setShowPartsDrawer] = useState(false);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSnapshot = (nickname: string) => {
    snapshotRef.current?.(nickname);
  };

  if (isMobile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 12,
          gap: 12,
        }}
      >
        <Toolbar onSnapshot={handleSnapshot} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowPartsDrawer(true)}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: '#F5F0EB',
              color: '#5C4033',
              border: '1px solid #BF8C6F',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🧩 零件库
          </button>
          <button
            onClick={() => setShowOrderDrawer(true)}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: '#E8E0D0',
              color: '#5C4033',
              border: '1px solid #BF8C6F',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📦 订单
          </button>
        </div>
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <Workspace snapshotRef={snapshotRef} />
        </div>
        {showPartsDrawer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(92,64,51,0.4)',
              zIndex: 900,
            }}
            onClick={() => setShowPartsDrawer(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                maxHeight: '70vh',
                overflowY: 'auto',
                background: '#FFFBF5',
                borderRadius: '0 0 16px 16px',
                padding: 16,
                animation: 'slideDown 200ms ease-out',
              }}
            >
              <div style={{ height: '70vh', overflowY: 'auto' }}>
                <PartPanel />
              </div>
            </div>
          </div>
        )}
        {showOrderDrawer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(92,64,51,0.4)',
              zIndex: 900,
            }}
            onClick={() => setShowOrderDrawer(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '75vh',
                overflowY: 'auto',
                background: '#FFFBF5',
                borderRadius: '16px 16px 0 0',
                padding: 16,
              }}
            >
              <div style={{ height: '70vh', overflowY: 'auto' }}>
                <OrderPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Toolbar onSnapshot={handleSnapshot} />
      <div
        style={{
          display: 'flex',
          gap: 16,
          flex: 1,
          maxWidth: '100%',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <PartPanel />
        <div style={{ flex: 1, maxWidth: 960, minWidth: 0 }}>
          <Workspace snapshotRef={snapshotRef} />
        </div>
        <OrderPanel />
      </div>
    </div>
  );
};

export default App;
