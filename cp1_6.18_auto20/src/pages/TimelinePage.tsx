import { useState } from 'react';
import { Timeline } from '@/components/Timeline';
import { NewNotePanel } from '@/components/NewNotePanel';
import { ResonanceCurve } from '@/components/ResonanceCurve';

export const TimelinePage = () => {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(180deg, var(--bg-start) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6C63FF, #FF6B6B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          笔记共鸣
        </h1>
      </header>

      <div
        style={{
          position: 'fixed',
          right: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 5,
        }}
      >
        <ResonanceCurve />
      </div>

      <Timeline />

      <button
        onClick={() => setPanelOpen(true)}
        style={{
          position: 'fixed',
          right: '32px',
          bottom: '32px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#6C63FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(108, 99, 255, 0.4)',
          zIndex: 50,
          transition: 'transform 300ms ease, box-shadow 300ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(108, 99, 255, 0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 99, 255, 0.4)';
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <NewNotePanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
};
