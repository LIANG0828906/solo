import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from './modules/state/store';
import { TrackPanel } from './components/TrackPanel';
import { WaveView } from './components/WaveView';
import { SpectrumView } from './components/SpectrumView';
import { TransportBar } from './components/TransportBar';

const BufferRing: React.FC = () => {
  const bufferUsage = useAppStore((s) => s.bufferUsage);
  const [flash, setFlash] = useState(false);
  const size = 28;
  const strokeW = 3;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - bufferUsage);

  useEffect(() => {
    if (bufferUsage > 0.9) {
      const id = setInterval(() => setFlash((f) => !f), 400);
      return () => clearInterval(id);
    }
    setFlash(false);
  }, [bufferUsage]);

  const color = bufferUsage > 0.9 ? (flash ? '#ff4444' : '#cc0000') : bufferUsage > 0.7 ? '#ffaa00' : '#22cc66';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2d2d44" strokeWidth={strokeW} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeW}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s' }}
        />
      </svg>
      <span style={{ fontSize: 9, color: '#888' }}>Buffer {(bufferUsage * 100).toFixed(0)}%</span>
    </div>
  );
};

const Resizer: React.FC<{ onResize: (delta: number) => void; direction: 'vertical' | 'horizontal' }> = ({ onResize, direction }) => {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastPos.current = direction === 'vertical' ? e.clientX : e.clientY;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const pos = direction === 'vertical' ? ev.clientX : ev.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        [direction === 'vertical' ? 'width' : 'height']: 5,
        [direction === 'vertical' ? 'height' : 'width']: '100%',
        cursor: direction === 'vertical' ? 'col-resize' : 'row-resize',
        background: '#2d2d44',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#6c5ce7'; }}
      onMouseLeave={(e) => { (e.target as HTMLElement).style.background = '#2d2d44'; }}
    />
  );
};

export const App: React.FC = () => {
  const leftPanelWidth = useAppStore((s) => s.leftPanelWidth);
  const rightPanelWidth = useAppStore((s) => s.rightPanelWidth);
  const spectrumDrawerOpen = useAppStore((s) => s.spectrumDrawerOpen);
  const windowWidth = useAppStore((s) => s.windowWidth);
  const setLeftPanelWidth = useAppStore((s) => s.setLeftPanelWidth);
  const setRightPanelWidth = useAppStore((s) => s.setRightPanelWidth);
  const toggleSpectrumDrawer = useAppStore((s) => s.toggleSpectrumDrawer);
  const setWindowWidth = useAppStore((s) => s.setWindowWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setWindowWidth]);

  const isCompact = windowWidth < 1024;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#121220', color: '#e0e0e0' }}>
      <TransportBar />

      <div style={{ flex: 1, display: 'flex', flexDirection: isCompact ? 'column' : 'row', overflow: 'hidden', marginTop: 48 }}>
        <div style={{
          width: isCompact ? '100%' : leftPanelWidth,
          minWidth: isCompact ? 0 : 200,
          maxWidth: isCompact ? '100%' : 500,
          background: '#1a1a2e',
          overflow: 'auto',
          transition: 'width 0.3s ease-in-out',
          flexShrink: 0,
          borderRight: isCompact ? 'none' : '1px solid #2d2d44',
        }}>
          <TrackPanel />
        </div>

        {!isCompact && (
          <Resizer direction="vertical" onResize={(delta) => setLeftPanelWidth(leftPanelWidth + delta)} />
        )}

        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, position: 'relative' }}>
          <WaveView />
        </div>

        {!isCompact && (
          <>
            <Resizer direction="vertical" onResize={(delta) => setRightPanelWidth(rightPanelWidth - delta)} />
            <div style={{
              width: rightPanelWidth,
              minWidth: 240,
              maxWidth: 500,
              background: '#0d0d0d',
              overflow: 'hidden',
              transition: 'width 0.3s ease-in-out',
              flexShrink: 0,
              borderLeft: '1px solid #2d2d44',
            }}>
              <SpectrumView />
            </div>
          </>
        )}
      </div>

      {isCompact && (
        <div style={{
          position: 'fixed',
          bottom: 28,
          right: 12,
          zIndex: 900,
        }}>
          <button
            onClick={toggleSpectrumDrawer}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: '#6c5ce7',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(108,92,231,0.5)',
            }}
            title="Toggle Spectrum"
          >
            📊
          </button>
        </div>
      )}

      {isCompact && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: spectrumDrawerOpen ? 280 : 0,
          background: '#0d0d0d',
          borderTop: spectrumDrawerOpen ? '1px solid #2d2d44' : 'none',
          transition: 'height 0.4s ease-in-out',
          overflow: 'hidden',
          zIndex: 800,
        }}>
          <SpectrumView />
        </div>
      )}

      <div style={{
        height: 28,
        background: '#1a1a2e',
        borderTop: '1px solid #2d2d44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: '#555' }}>Waveform Studio v1.0</span>
        <BufferRing />
        <span style={{ fontSize: 9, color: '#555' }}>44100Hz / 16bit</span>
      </div>
    </div>
  );
};
