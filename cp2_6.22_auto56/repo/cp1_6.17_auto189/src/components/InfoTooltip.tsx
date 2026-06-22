import { useEffect, useState } from 'react';
import type { Artifact } from '../types/artifact';

interface InfoTooltipProps {
  artifact: Artifact | null;
  position: { x: number; y: number } | null;
  visible: boolean;
}

export function InfoTooltip({ artifact, position, visible }: InfoTooltipProps) {
  const [glowPhase, setGlowPhase] = useState(0);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setGlowPhase((prev) => (prev + 0.04) % (Math.PI * 2));
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  if (!visible || !artifact || !position) return null;

  const glowIntensity = 0.5 + Math.sin(glowPhase * (1.5 / (Math.PI * 2)) * Math.PI * 2) * 0.5;
  const glowColor = artifact.eraColor || '#4A6B5D';

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        width: 240,
        background: 'rgba(30, 30, 46, 0.9)',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        pointerEvents: 'none',
        zIndex: 100,
        boxShadow: `0 0 ${10 + glowIntensity * 15}px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
        border: `1px solid ${glowColor}`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
          fontFamily: "'Georgia', 'SimSun', serif",
        }}
      >
        {artifact.name}
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#aaa',
          marginBottom: 6,
        }}
      >
        {artifact.dynasty} · {artifact.era}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#888' }}>美工评级：</span>
        <span style={{ color: '#ffd700', fontSize: 14 }}>
          {'★'.repeat(artifact.rating)}
          <span style={{ color: '#444' }}>{'★'.repeat(5 - artifact.rating)}</span>
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgba(30, 30, 46, 0.9)',
        }}
      />
    </div>
  );
}
