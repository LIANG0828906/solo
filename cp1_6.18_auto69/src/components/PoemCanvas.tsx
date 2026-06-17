import { useEffect, useRef } from 'react';
import { useGameStore } from '../state/gameStore';
import { WordFragment } from './WordFragment';
import { PoemGrid } from './PoemGrid';
import { ParticleEffect } from './ParticleEffect';

export const PoemCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const availableFragments = useGameStore((state) => state.availableFragments);
  const showParticles = useGameStore((state) => state.showParticles);
  const particlePosition = useGameStore((state) => state.particlePosition);
  const lastActionTime = useGameStore((state) => state.lastActionTime);
  const resetCombo = useGameStore((state) => state.resetCombo);
  const updateTime = useGameStore((state) => state.updateTime);

  useEffect(() => {
    const timer = setInterval(() => {
      updateTime();

      const now = Date.now();
      if (now - lastActionTime > 30000) {
        resetCombo();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastActionTime, resetCombo, updateTime]);

  const unusedFragmentIds = availableFragments
    .filter((f) => !f.isUsed)
    .map((f) => f.id);

  return (
    <div
      ref={canvasRef}
      className="poem-canvas"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        height: '600px',
        background:
          'radial-gradient(ellipse at center, var(--paper-bg-start) 0%, var(--paper-bg-end) 100%)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow:
          '0 4px 20px rgba(0,0,0,0.3), inset 0 0 60px rgba(139, 90, 43, 0.1)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          boxShadow:
            'inset 0 0 80px rgba(139, 90, 43, 0.15), inset 0 0 120px rgba(139, 90, 43, 0.08)',
          borderRadius: '8px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Ma Shan Zheng', cursive",
          fontSize: '24px',
          color: '#5D4E37',
          letterSpacing: '4px',
        }}
      >
        幻境拼诗
      </div>

      <PoemGrid />

      {unusedFragmentIds.map((id) => (
        <WordFragment key={id} fragmentId={id} />
      ))}

      {particlePosition && (
        <ParticleEffect
          x={particlePosition.x}
          y={particlePosition.y}
          active={showParticles}
        />
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#8B7355',
          opacity: 0.6,
        }}
      >
        拖拽碎片到上方格子中，点击已放置的碎片可移除
      </div>
    </div>
  );
};
