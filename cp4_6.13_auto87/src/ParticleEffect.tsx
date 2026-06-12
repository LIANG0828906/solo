import { useEffect, useState } from 'react';
import './ParticleEffect.css';

export type ParticleType =
  | 'fire'
  | 'flame'
  | 'ice'
  | 'frost'
  | 'thunder'
  | 'storm'
  | 'shadow'
  | 'chaos'
  | 'purify'
  | 'divine'
  | 'corrosion'
  | 'rock'
  | 'rift'
  | 'wind'
  | 'ghost'
  | 'light'
  | 'poison'
  | 'time'
  | 'none';

interface ParticleEffectProps {
  type: ParticleType;
  active: boolean;
}

const PARTICLE_COUNT = 12;

function generateParticles(count: number, type: ParticleType) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = 40 + Math.random() * 30;
    const size = 6 + Math.random() * 10;
    const delay = Math.random() * 0.3;
    const duration = 0.9 + Math.random() * 0.3;

    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size,
      delay,
      duration,
      type,
    };
  });
}

export function ParticleEffect({ type, active }: ParticleEffectProps) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
      type: ParticleType;
    }>
  >([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (active && type !== 'none') {
      setParticles(generateParticles(PARTICLE_COUNT, type));
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [active, type]);

  if (!isAnimating || type === 'none') {
    return null;
  }

  return (
    <div className={`particle-container particle-${type}`}>
      <div className="particle-core" />
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            '--tx': `${p.x}px`,
            '--ty': `${p.y}px`,
            '--size': `${p.size}px`,
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
          } as React.CSSProperties}
        />
      ))}
      <div className="particle-ring" />
      <div className="particle-flash" />
    </div>
  );
}

export default ParticleEffect;
