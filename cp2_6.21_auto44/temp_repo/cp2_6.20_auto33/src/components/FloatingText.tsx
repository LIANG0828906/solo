import React, { useMemo } from 'react';
import type { FloatingText } from '../types';

interface Props {
  items: FloatingText[];
}

const generateSwayKeyframes = (id: string, amplitude: number) => {
  const points = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const pct = (i / steps) * 100;
    const progress = i / steps;
    const sway = Math.sin(progress * Math.PI * 2) * amplitude * progress;
    points.push(`${pct}% { transform: translateX(${sway.toFixed(2)}px); }`);
  }
  return `@keyframes float-sway-${id} { ${points.join(' ')} }`;
};

export const FloatingTextLayer: React.FC<Props> = ({ items }) => {
  const styleTags = useMemo(() => {
    return items.map(t => {
      const amplitude = 4 + Math.random() * 4;
      return generateSwayKeyframes(t.id, amplitude);
    });
  }, [items.map(i => i.id).join('|')]);

  return (
    <>
      <style>{styleTags.join('\n')}</style>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
        zIndex: 40,
      }}>
        {items.map(t => {
          const duration = t.duration ? t.duration / 1000 : 1.3;
          const fadeOutStart = 0.6;
          const offsetX = t.offsetX || 0;
          const offsetY = t.offsetY || 0;
          const travelDistance = 60 + Math.random() * 20;
          return (
            <div key={t.id} style={{
              position: 'absolute',
              left: `calc(${t.x}% + ${offsetX}px)`,
              top: `calc(${t.y}% + ${offsetY}px)`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 41,
            }}>
              <div style={{
                animation: [
                  `float-up-advanced-${t.id} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                  `float-sway-${t.id} ${duration}s linear forwards`,
                ].join(', '),
                fontWeight: 800,
                fontSize: 20,
                color: t.color,
                fontFamily: 'var(--font-cartoon)',
                textShadow: '0 2px 4px rgba(0,0,0,0.15), 0 0 8px rgba(255,255,255,0.8)',
                whiteSpace: 'nowrap',
                willChange: 'transform, opacity',
              }}>
                <style>{`
                  @keyframes float-up-advanced-${t.id} {
                    0% {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                    }
                    ${(fadeOutStart * 100).toFixed(0)}% {
                      opacity: 1;
                      transform: translateY(-${(travelDistance * fadeOutStart * 1.1).toFixed(0)}px) scale(1.18);
                    }
                    100% {
                      opacity: 0;
                      transform: translateY(-${travelDistance.toFixed(0)}px) scale(1.3);
                    }
                  }
                `}</style>
                {t.text}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default FloatingTextLayer;
