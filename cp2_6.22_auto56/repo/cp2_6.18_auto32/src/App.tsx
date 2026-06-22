import React, { useState, useEffect } from 'react';
import { Canvas } from './ui/Canvas';
import { ComponentPanel } from './ui/ComponentPanel';
import { LayerPanel } from './ui/LayerPanel';
import { ExportBar } from './ui/ExportBar';

const MobileDrawer: React.FC<{
  side: 'left' | 'right';
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ side, visible, onClose, children }) => {
  if (!visible) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30,30,46,0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
        }}
      />
      <div
        className={side === 'left' ? 'panel-slide-left' : 'panel-slide-right'}
        style={{
          position: 'fixed',
          top: 0,
          [side]: 0,
          bottom: 0,
          width: 260,
          background: '#2A2A3E',
          zIndex: 9999,
          overflow: 'auto',
          borderRight: side === 'left' ? '1px solid #4A4A5E' : undefined,
          borderLeft: side === 'right' ? '1px solid #4A4A5E' : undefined,
          padding: 12,
        }}
      >
        {children}
      </div>
    </>
  );
};

export const App: React.FC = () => {
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 1024);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (isNarrow) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#1E1E2E', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          gap: 8,
          zIndex: 100,
        }}>
          <button
            onClick={() => setLeftDrawerOpen(true)}
            style={{
              background: '#3A3A50', border: '1px solid #4A4A5E', borderRadius: 8,
              padding: '8px 12px', color: '#E0E0E0', cursor: 'pointer', fontSize: 12,
            }}
          >
            ◀ Components
          </button>
          <button
            onClick={() => setRightDrawerOpen(true)}
            style={{
              background: '#3A3A50', border: '1px solid #4A4A5E', borderRadius: 8,
              padding: '8px 12px', color: '#E0E0E0', cursor: 'pointer', fontSize: 12,
            }}
          >
            Layers ▶
          </button>
        </div>
        <Canvas />
        <ExportBar />
        <MobileDrawer side="left" visible={leftDrawerOpen} onClose={() => setLeftDrawerOpen(false)}>
          <ComponentPanel />
        </MobileDrawer>
        <MobileDrawer side="right" visible={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)}>
          <LayerPanel />
        </MobileDrawer>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1E1E2E',
      display: 'flex',
      alignItems: 'stretch',
      padding: 12,
      gap: 12,
      position: 'relative',
    }}>
      <ComponentPanel />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <Canvas />
        <ExportBar />
      </div>
      <LayerPanel />
    </div>
  );
};
