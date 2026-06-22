import React, { useState, useEffect, useRef } from 'react';

interface CelebrationParticlesProps {
  trigger: boolean;
  particleCount?: number;
  colors?: string[];
}

interface Particle {
  id: number;
  shape: 'circle' | 'square';
  color: string;
  size: number;
  tx: number;
  ty: number;
  duration: number;
}

const DEFAULT_COLORS = [
  '#E74C3C',
  '#F39C12',
  '#27AE60',
  '#8B5A2B',
  '#C49A6C',
  '#E91E63',
  '#9C27B0',
];

const CelebrationParticles: React.FC<CelebrationParticlesProps> = ({
  trigger,
  particleCount = 30,
  colors = DEFAULT_COLORS,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevTriggerRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trigger && !prevTriggerRef.current) {
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        newParticles.push({
          id: Date.now() + i,
          shape: Math.random() > 0.5 ? 'circle' : 'square',
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 4,
          tx,
          ty,
          duration: 0.8 + Math.random() * 0.7,
        });
      }

      setParticles(newParticles);

      const maxDuration = Math.max(...newParticles.map((p) => p.duration)) * 1000;
      setTimeout(() => {
        setParticles([]);
      }, maxDuration);
    }

    prevTriggerRef.current = trigger;
  }, [trigger, particleCount, colors]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: particle.shape === 'circle' ? '50%' : '2px',
            pointerEvents: 'none',
            '--tx': `${particle.tx}px`,
            '--ty': `${particle.ty}px`,
            animation: `particleBurst ${particle.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default CelebrationParticles;
