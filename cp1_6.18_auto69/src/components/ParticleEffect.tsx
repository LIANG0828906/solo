import { useMemo } from 'react';

interface ParticleEffectProps {
  x: number;
  y: number;
  active: boolean;
}

interface Particle {
  id: number;
  tx: number;
  ty: number;
  delay: number;
  size: number;
}

export const ParticleEffect = ({ x, y, active }: ParticleEffectProps) => {
  const particles = useMemo<Particle[]>(() => {
    const result: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.5;
      const distance = 60 + Math.random() * 80;
      result.push({
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        delay: Math.random() * 0.2,
        size: 4 + Math.random() * 4,
      });
    }
    return result;
  }, []);

  if (!active) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            backgroundColor: '#D4A843',
            borderRadius: '2px',
            left: -particle.size / 2,
            top: -particle.size / 2,
            '--tx': `${particle.tx}px`,
            '--ty': `${particle.ty}px`,
            animation: `particle-fade 0.8s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
            boxShadow: '0 0 6px #F0C674',
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
