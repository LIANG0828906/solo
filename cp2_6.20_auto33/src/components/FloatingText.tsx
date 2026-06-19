import React from 'react';
import type { FloatingText } from '../types';

interface Props {
  items: FloatingText[];
}

export const FloatingTextLayer: React.FC<Props> = ({ items }) => {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      zIndex: 40,
    }}>
      {items.map(t => (
        <div key={t.id} style={{
          position: 'absolute',
          left: `${t.x}%`,
          top: `${t.y}%`,
          transform: 'translate(-50%, -50%)',
          animation: 'float-up 1.1s ease-out forwards',
          fontWeight: 800,
          fontSize: 20,
          color: t.color,
          fontFamily: 'var(--font-cartoon)',
          textShadow: '0 2px 4px rgba(0,0,0,0.15), 0 0 8px rgba(255,255,255,0.8)',
          whiteSpace: 'nowrap',
        }}>{t.text}</div>
      ))}
    </div>
  );
};

export default FloatingTextLayer;
